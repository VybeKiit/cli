use vybekiit_dedup::detect;
use vybekiit_dedup::index;
use vybekiit_dedup::index::{DedupIndex, IndexedExport};
use vybekiit_dedup::scan::{extract_exports, tokenize_identifier};

use std::fs;
use tempfile::TempDir;

// ═══════════════════════════════════════════════════
// Scan / tokenize tests
// ═══════════════════════════════════════════════════

#[test]
fn tokenize_camel_case() {
    assert_eq!(
        tokenize_identifier("handlePaymentEvent"),
        vec!["handle", "payment", "event"]
    );
}

#[test]
fn tokenize_pascal_case() {
    assert_eq!(
        tokenize_identifier("PaymentProvider"),
        vec!["payment", "provider"]
    );
}

#[test]
fn tokenize_single_word() {
    assert_eq!(tokenize_identifier("payment"), vec!["payment"]);
}

#[test]
fn extract_exported_function() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
export function formatPrice(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
}
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "formatPrice");
    assert!(exports[0].body_hash != 0);
    assert_eq!(exports[0].name_tokens, vec!["format", "price"]);
}

#[test]
fn extract_exported_const_arrow() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
export const handleWebhook = (payload: unknown): void => {
    console.log(payload);
};
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "handleWebhook");
}

#[test]
fn extract_exported_class() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
export class PaymentService {
    async charge(amount: number) {
        return { success: true };
    }
}
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "PaymentService");
}

#[test]
fn extract_exported_interface() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
export interface CheckoutParams {
    readonly productId: string;
    readonly amount: number;
}
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "CheckoutParams");
}

#[test]
fn extract_multiple_exports() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
export const API_URL = "https://example.com";
export function parseConfig(env: Record<string, string>) { return env; }
export type Config = { key: string };
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 3);
    let names: Vec<&str> = exports.iter().map(|e| e.name.as_str()).collect();
    assert!(names.contains(&"API_URL"));
    assert!(names.contains(&"parseConfig"));
    assert!(names.contains(&"Config"));
}

#[test]
fn no_exports_for_private_functions() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("test.ts");
    fs::write(
        &file,
        r#"
function privateHelper() { return 42; }
const internalState = {};
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 0);
}

#[test]
fn handles_tsx_files() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("Button.tsx");
    fs::write(
        &file,
        r#"
export const Button = ({ label }: { label: string }) => {
    return <button>{label}</button>;
};
"#,
    )
    .unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "Button");
}

#[test]
fn handles_malformed_file_gracefully() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("broken.ts");
    fs::write(&file, "export function {{{ broken syntax").unwrap();

    let exports = extract_exports(&file, dir.path());
    assert_eq!(exports.len(), 0);
}

// ═══════════════════════════════════════════════════
// Level A — exact/near-exact detection
// ═══════════════════════════════════════════════════

fn make_index(exports: Vec<IndexedExport>) -> DedupIndex {
    DedupIndex {
        built_at: 0,
        scope_root: "/test".to_string(),
        exports,
    }
}

fn make_export(name: &str, file: &str, body_hash: u64) -> IndexedExport {
    IndexedExport {
        name: name.to_string(),
        file_path: file.to_string(),
        name_tokens: tokenize_identifier(name),
        body_hash,
        skeleton_hash: 0,
        domain_keywords: vec![],
        signature_shape: "fn:1:unknown".to_string(),
    }
}

#[test]
fn level_a_detects_similar_name_via_intent() {
    let idx = make_index(vec![
        make_export("formatPrice", "packages/payments/src/utils.ts", 111),
        make_export("validateEmail", "packages/auth/src/validate.ts", 222),
    ]);

    let matches = detect::run(&idx, Some("format price"), None, std::path::Path::new("/test"));
    assert!(!matches.is_empty());
    assert_eq!(matches[0].level, "A");
    assert!(matches[0].existing.contains("formatPrice"));
}

#[test]
fn level_a_no_match_for_unrelated_intent() {
    let idx = make_index(vec![make_export(
        "formatPrice",
        "packages/payments/src/utils.ts",
        111,
    )]);

    let matches = detect::run(
        &idx,
        Some("upload avatar image"),
        None,
        std::path::Path::new("/test"),
    );
    let level_a: Vec<_> = matches.iter().filter(|m| m.level == "A").collect();
    assert!(level_a.is_empty());
}

#[test]
fn level_a_exact_body_hash_produces_match() {
    let dir = TempDir::new().unwrap();

    let file_a = dir.path().join("a.ts");
    fs::write(
        &file_a,
        r#"export function formatAmount(n: number): string { return n.toFixed(2); }"#,
    )
    .unwrap();

    let file_b = dir.path().join("b.ts");
    fs::write(
        &file_b,
        r#"export function formatAmount(n: number): string { return n.toFixed(2); }"#,
    )
    .unwrap();

    let exports_a = extract_exports(&file_a, dir.path());
    let exports_b = extract_exports(&file_b, dir.path());

    // Same body → same hash
    assert_eq!(exports_a[0].body_hash, exports_b[0].body_hash);
}

// ═══════════════════════════════════════════════════
// Level B — structural detection
// ═══════════════════════════════════════════════════

#[test]
fn level_b_same_structure_same_skeleton() {
    let dir = TempDir::new().unwrap();

    let file_a = dir.path().join("a.ts");
    fs::write(
        &file_a,
        r#"export function getUser(id: string) { return fetch('/users/' + id).then(r => r.json()); }"#,
    )
    .unwrap();

    let file_b = dir.path().join("b.ts");
    fs::write(
        &file_b,
        r#"export function getOrder(id: string) { return fetch('/orders/' + id).then(r => r.json()); }"#,
    )
    .unwrap();

    let exports_a = extract_exports(&file_a, dir.path());
    let exports_b = extract_exports(&file_b, dir.path());

    // Same structural shape → same skeleton hash
    assert_eq!(exports_a[0].skeleton_hash, exports_b[0].skeleton_hash);
}

#[test]
fn level_b_different_structure_different_skeleton() {
    let dir = TempDir::new().unwrap();

    let file_a = dir.path().join("a.ts");
    fs::write(
        &file_a,
        r#"export function add(a: number, b: number) { return a + b; }"#,
    )
    .unwrap();

    let file_b = dir.path().join("b.ts");
    fs::write(
        &file_b,
        r#"export function multiply(a: number, b: number) { if (b === 0) return 0; return a * b; }"#,
    )
    .unwrap();

    let exports_a = extract_exports(&file_a, dir.path());
    let exports_b = extract_exports(&file_b, dir.path());

    // Different control flow → different skeleton
    assert_ne!(exports_a[0].skeleton_hash, exports_b[0].skeleton_hash);
}

// ═══════════════════════════════════════════════════
// Level D — concern overlap detection
// ═══════════════════════════════════════════════════

#[test]
fn level_d_detects_domain_overlap_via_map() {
    let dir = TempDir::new().unwrap();

    let vybekiit_dir = dir.path().join(".vybekiit");
    fs::create_dir_all(&vybekiit_dir).unwrap();
    fs::write(
        vybekiit_dir.join("domain-map.json"),
        r#"{"domains":{"payment":{"home":"packages/payments"},"auth":{"home":"packages/auth"}}}"#,
    )
    .unwrap();

    let idx = DedupIndex {
        built_at: 0,
        scope_root: dir.path().to_string_lossy().to_string(),
        exports: vec![],
    };

    let matches = detect::run(&idx, Some("payment webhook handler"), None, dir.path());
    let level_d: Vec<_> = matches.iter().filter(|m| m.level == "D").collect();
    assert!(!level_d.is_empty());
    assert!(level_d[0].existing.contains("packages/payments"));
}

#[test]
fn level_d_no_overlap_for_unknown_domain() {
    let dir = TempDir::new().unwrap();

    let vybekiit_dir = dir.path().join(".vybekiit");
    fs::create_dir_all(&vybekiit_dir).unwrap();
    fs::write(
        vybekiit_dir.join("domain-map.json"),
        r#"{"domains":{"payment":{"home":"packages/payments"}}}"#,
    )
    .unwrap();

    let idx = DedupIndex {
        built_at: 0,
        scope_root: dir.path().to_string_lossy().to_string(),
        exports: vec![],
    };

    let matches = detect::run(&idx, Some("image resizing utility"), None, dir.path());
    let level_d: Vec<_> = matches.iter().filter(|m| m.level == "D").collect();
    assert!(level_d.is_empty());
}

#[test]
fn level_d_no_overlap_when_target_is_in_home() {
    let dir = TempDir::new().unwrap();

    let vybekiit_dir = dir.path().join(".vybekiit");
    fs::create_dir_all(&vybekiit_dir).unwrap();
    fs::write(
        vybekiit_dir.join("domain-map.json"),
        r#"{"domains":{"payment":{"home":"packages/payments"}}}"#,
    )
    .unwrap();

    let target_dir = dir.path().join("packages/payments/src");
    fs::create_dir_all(&target_dir).unwrap();
    let target_file = target_dir.join("newWebhook.ts");
    fs::write(&target_file, "export function handleNew() {}").unwrap();

    let idx = DedupIndex {
        built_at: 0,
        scope_root: dir.path().to_string_lossy().to_string(),
        exports: vec![],
    };

    let matches = detect::run(
        &idx,
        Some("payment handler"),
        Some(target_file.as_path()),
        dir.path(),
    );
    let level_d: Vec<_> = matches.iter().filter(|m| m.level == "D").collect();
    assert!(level_d.is_empty());
}

// ═══════════════════════════════════════════════════
// Index system tests
// ═══════════════════════════════════════════════════

#[test]
fn index_rebuild_creates_file() {
    let dir = TempDir::new().unwrap();
    let src_dir = dir.path().join("src");
    fs::create_dir_all(&src_dir).unwrap();
    fs::write(
        src_dir.join("utils.ts"),
        "export function hello() { return 'world'; }",
    )
    .unwrap();

    let count = index::rebuild_index(dir.path()).unwrap();
    assert_eq!(count, 1);

    let index_path = dir.path().join(".vybekiit/dedup-index.json");
    assert!(index_path.exists());
}

#[test]
fn index_load_or_rebuild_creates_fresh() {
    let dir = TempDir::new().unwrap();
    let src_dir = dir.path().join("src");
    fs::create_dir_all(&src_dir).unwrap();
    fs::write(
        src_dir.join("math.ts"),
        r#"
export function add(a: number, b: number) { return a + b; }
export function subtract(a: number, b: number) { return a - b; }
"#,
    )
    .unwrap();

    let idx = index::load_or_rebuild(dir.path()).unwrap();
    assert_eq!(idx.exports.len(), 2);
}

#[test]
fn index_skips_test_files() {
    let dir = TempDir::new().unwrap();
    fs::write(dir.path().join("utils.ts"), "export function real() {}").unwrap();
    fs::write(
        dir.path().join("utils.test.ts"),
        "export function testHelper() {}",
    )
    .unwrap();

    let count = index::rebuild_index(dir.path()).unwrap();
    assert_eq!(count, 1);
}

#[test]
fn index_skips_declaration_files() {
    let dir = TempDir::new().unwrap();
    fs::write(
        dir.path().join("types.d.ts"),
        "export interface Foo { bar: string; }",
    )
    .unwrap();
    fs::write(dir.path().join("real.ts"), "export const x = 1;").unwrap();

    let count = index::rebuild_index(dir.path()).unwrap();
    assert_eq!(count, 1);
}
