use std::path::Path;
use swc_common::input::SourceFileInput;
use swc_common::sync::Lrc;
use swc_common::{FileName, SourceMap, Spanned};
use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, Parser, Syntax, TsSyntax};

/// A single exported symbol extracted from a TypeScript file.
#[derive(Debug, Clone)]
pub struct ExportedSymbol {
    /// The symbol name (e.g. "handlePaymentEvent")
    pub name: String,
    /// The file path relative to scope root
    pub file_path: String,
    /// Tokenized name for fuzzy matching: "handlePaymentEvent" → ["handle", "payment", "event"]
    pub name_tokens: Vec<String>,
    /// Hash of the function body (for Level A exact detection)
    pub body_hash: u64,
    /// Structural skeleton hash (for Level B — type shape + control flow, no identifiers)
    pub skeleton_hash: u64,
    /// Domain keywords extracted from path + name
    pub domain_keywords: Vec<String>,
    /// Signature shape: "params_count:return_kind" for quick structural comparison
    pub signature_shape: String,
}

/// Parse a TypeScript/TSX file and extract all exported symbols.
pub fn extract_exports(file_path: &Path, scope_root: &Path) -> Vec<ExportedSymbol> {
    let source = match std::fs::read_to_string(file_path) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    let cm: Lrc<SourceMap> = Default::default();
    let fm = cm.new_source_file(
        Lrc::new(FileName::Real(file_path.to_path_buf())),
        source.clone(),
    );

    let is_tsx = file_path
        .extension()
        .is_some_and(|ext| ext == "tsx" || ext == "jsx");

    let lexer = Lexer::new(
        Syntax::Typescript(TsSyntax {
            tsx: is_tsx,
            decorators: true,
            ..Default::default()
        }),
        Default::default(),
        SourceFileInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);
    let module = match parser.parse_module() {
        Ok(m) => m,
        Err(_) => return vec![],
    };

    let relative_path = file_path
        .strip_prefix(scope_root)
        .unwrap_or(file_path)
        .to_string_lossy()
        .to_string();

    let mut exports = Vec::new();

    for item in &module.body {
        match item {
            ModuleItem::ModuleDecl(decl) => {
                extract_from_module_decl(decl, &source, &relative_path, &mut exports);
            }
            ModuleItem::Stmt(Stmt::Decl(decl)) => {
                // Top-level declarations that might be exported via `export { name }`
                // We handle these through ExportNamedDecl, but also check for
                // `export const/function` patterns
                extract_from_decl_if_exported(decl, &source, &relative_path, &mut exports, false);
            }
            _ => {}
        }
    }

    exports
}

fn extract_from_module_decl(
    decl: &ModuleDecl,
    source: &str,
    relative_path: &str,
    exports: &mut Vec<ExportedSymbol>,
) {
    match decl {
        ModuleDecl::ExportDecl(export_decl) => {
            extract_from_decl_if_exported(
                &export_decl.decl,
                source,
                relative_path,
                exports,
                true,
            );
        }
        ModuleDecl::ExportNamed(named) => {
            // `export { foo, bar }` — we record the names but can't get body info
            for spec in &named.specifiers {
                if let ExportSpecifier::Named(named_spec) = spec {
                    let name = match &named_spec.exported {
                        Some(ModuleExportName::Ident(id)) => id.sym.to_string(),
                        Some(ModuleExportName::Str(s)) => {
                            // Wtf8Atom doesn't impl Display; use to_atom_lossy
                            s.value.to_atom_lossy().to_string()
                        }
                        None => match &named_spec.orig {
                            ModuleExportName::Ident(id) => id.sym.to_string(),
                            ModuleExportName::Str(s) => {
                                s.value.to_atom_lossy().to_string()
                            }
                        },
                    };
                    exports.push(build_symbol(name, relative_path, "", "re-export"));
                }
            }
        }
        ModuleDecl::ExportDefaultDecl(default_decl) => {
            let name = match &default_decl.decl {
                DefaultDecl::Class(class_expr) => class_expr
                    .ident
                    .as_ref()
                    .map(|i| i.sym.to_string())
                    .unwrap_or_else(|| "default".to_string()),
                DefaultDecl::Fn(fn_expr) => fn_expr
                    .ident
                    .as_ref()
                    .map(|i| i.sym.to_string())
                    .unwrap_or_else(|| "default".to_string()),
                _ => "default".to_string(),
            };
            exports.push(build_symbol(name, relative_path, "", "default"));
        }
        _ => {}
    }
}

fn extract_from_decl_if_exported(
    decl: &Decl,
    source: &str,
    relative_path: &str,
    exports: &mut Vec<ExportedSymbol>,
    is_exported: bool,
) {
    if !is_exported {
        return;
    }

    match decl {
        Decl::Fn(fn_decl) => {
            let name = fn_decl.ident.sym.to_string();
            let body_text = extract_span_text(source, &fn_decl.function);
            let sig_shape = format!("fn:{}:{}", fn_decl.function.params.len(), "unknown");
            exports.push(build_symbol(name, relative_path, &body_text, &sig_shape));
        }
        Decl::Var(var_decl) => {
            for declarator in &var_decl.decls {
                if let Pat::Ident(ident) = &declarator.name {
                    let name = ident.sym.to_string();
                    let body_text = declarator
                        .init
                        .as_ref()
                        .map(|init| extract_expr_text(source, init))
                        .unwrap_or_default();
                    let sig_shape = if is_arrow_or_fn_expr(declarator.init.as_deref()) {
                        "arrow:unknown:unknown".to_string()
                    } else {
                        "const:value".to_string()
                    };
                    exports.push(build_symbol(name, relative_path, &body_text, &sig_shape));
                }
            }
        }
        Decl::Class(class_decl) => {
            let name = class_decl.ident.sym.to_string();
            let body_text = extract_class_text(source, &class_decl.class);
            let sig_shape = format!("class:{}", class_decl.class.body.len());
            exports.push(build_symbol(name, relative_path, &body_text, &sig_shape));
        }
        Decl::TsInterface(iface) => {
            let name = iface.id.sym.to_string();
            let sig_shape = format!("interface:{}", iface.body.body.len());
            exports.push(build_symbol(name, relative_path, "", &sig_shape));
        }
        Decl::TsTypeAlias(alias) => {
            let name = alias.id.sym.to_string();
            exports.push(build_symbol(name, relative_path, "", "type"));
        }
        Decl::TsEnum(ts_enum) => {
            let name = ts_enum.id.sym.to_string();
            let sig_shape = format!("enum:{}", ts_enum.members.len());
            exports.push(build_symbol(name, relative_path, "", &sig_shape));
        }
        _ => {}
    }
}

fn is_arrow_or_fn_expr(expr: Option<&Expr>) -> bool {
    matches!(expr, Some(Expr::Arrow(_) | Expr::Fn(_)))
}

fn extract_span_text(source: &str, func: &Function) -> String {
    func.body
        .as_ref()
        .map(|body| {
            // SWC spans start at byte position 1 (not 0) for the first source file
            let start = (body.span.lo.0 as usize).saturating_sub(1);
            let end = (body.span.hi.0 as usize).saturating_sub(1);
            source.get(start..end).unwrap_or("").to_string()
        })
        .unwrap_or_default()
}

fn extract_expr_text(source: &str, expr: &Expr) -> String {
    let span = expr.span();
    let start = (span.lo.0 as usize).saturating_sub(1);
    let end = (span.hi.0 as usize).saturating_sub(1);
    source.get(start..end).unwrap_or("").to_string()
}

fn extract_class_text(source: &str, class: &Class) -> String {
    let start = (class.span.lo.0 as usize).saturating_sub(1);
    let end = (class.span.hi.0 as usize).saturating_sub(1);
    source.get(start..end).unwrap_or("").to_string()
}

/// Build an ExportedSymbol from extracted data.
fn build_symbol(
    name: String,
    file_path: &str,
    body_text: &str,
    sig_shape: &str,
) -> ExportedSymbol {
    let name_tokens = tokenize_identifier(&name);
    let domain_keywords = extract_domain_keywords(file_path, &name);
    let body_hash = xxhash_rust::xxh3::xxh3_64(body_text.as_bytes());
    let skeleton_hash = compute_skeleton_hash(body_text);

    ExportedSymbol {
        name,
        file_path: file_path.to_string(),
        name_tokens,
        body_hash,
        skeleton_hash,
        domain_keywords,
        signature_shape: sig_shape.to_string(),
    }
}

/// Tokenize a camelCase/PascalCase identifier into lowercase words.
/// "handlePaymentEvent" → ["handle", "payment", "event"]
pub fn tokenize_identifier(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();

    for ch in name.chars() {
        if ch.is_uppercase() && !current.is_empty() {
            tokens.push(current.to_lowercase());
            current = String::new();
        }
        current.push(ch);
    }
    if !current.is_empty() {
        tokens.push(current.to_lowercase());
    }
    tokens
}

/// Extract domain keywords from file path and symbol name.
fn extract_domain_keywords(file_path: &str, name: &str) -> Vec<String> {
    let mut keywords = Vec::new();

    // From path segments
    for segment in file_path.split('/') {
        let seg = segment
            .trim_end_matches(".ts")
            .trim_end_matches(".tsx")
            .trim_end_matches(".js")
            .trim_end_matches(".jsx");
        if !seg.is_empty()
            && seg != "src"
            && seg != "index"
            && seg != "lib"
            && seg != "utils"
            && seg != "helpers"
        {
            keywords.push(seg.to_lowercase());
        }
    }

    // From name tokens
    keywords.extend(tokenize_identifier(name));
    keywords.sort();
    keywords.dedup();
    keywords
}

/// Compute a skeleton hash — strips identifiers, keeps structure.
/// This is a simplified version: normalize whitespace, replace all identifiers with '_',
/// then hash. A more sophisticated version would use the AST directly.
fn compute_skeleton_hash(body_text: &str) -> u64 {
    if body_text.is_empty() {
        return 0;
    }

    // Simple structural normalization:
    // 1. Replace all identifier-like tokens (consecutive word chars) with "_"
    // 2. Collapse whitespace
    // 3. Hash the result
    let mut skeleton = String::with_capacity(body_text.len());
    let mut in_word = false;

    for ch in body_text.chars() {
        if ch.is_alphanumeric() || ch == '_' {
            if !in_word {
                skeleton.push('_');
                in_word = true;
            }
        } else {
            in_word = false;
            if ch.is_whitespace() {
                if !skeleton.ends_with(' ') {
                    skeleton.push(' ');
                }
            } else {
                skeleton.push(ch);
            }
        }
    }

    xxhash_rust::xxh3::xxh3_64(skeleton.as_bytes())
}
