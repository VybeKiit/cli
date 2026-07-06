use crate::scan::ExportedSymbol;
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

/// The dedup index — a serializable collection of all exports in scope.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DedupIndex {
    /// When this index was built (Unix timestamp)
    pub built_at: u64,
    /// Root path this index covers
    pub scope_root: String,
    /// All exported symbols found
    pub exports: Vec<IndexedExport>,
}

/// A single export in the index (serializable version of ExportedSymbol).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexedExport {
    pub name: String,
    pub file_path: String,
    pub name_tokens: Vec<String>,
    pub body_hash: u64,
    pub skeleton_hash: u64,
    pub domain_keywords: Vec<String>,
    pub signature_shape: String,
}

impl From<ExportedSymbol> for IndexedExport {
    fn from(sym: ExportedSymbol) -> Self {
        IndexedExport {
            name: sym.name,
            file_path: sym.file_path,
            name_tokens: sym.name_tokens,
            body_hash: sym.body_hash,
            skeleton_hash: sym.skeleton_hash,
            domain_keywords: sym.domain_keywords,
            signature_shape: sym.signature_shape,
        }
    }
}

/// Get the index file path for a given scope.
fn index_path(scope: &Path) -> PathBuf {
    scope.join(".vybekiit").join("dedup-index.json")
}

/// Check if the index is stale (any .ts/.tsx file newer than the index).
fn is_stale(scope: &Path) -> bool {
    let idx_path = index_path(scope);
    let idx_mtime = match std::fs::metadata(&idx_path) {
        Ok(meta) => meta.modified().unwrap_or(SystemTime::UNIX_EPOCH),
        Err(_) => return true, // No index = stale
    };

    // Walk for any .ts/.tsx file newer than the index
    let walker = WalkBuilder::new(scope)
        .hidden(false)
        .git_ignore(true)
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            // Skip node_modules, .git, dist, build
            !matches!(
                name.as_ref(),
                "node_modules" | ".git" | "dist" | "build" | "out" | ".cache" | "target"
            )
        })
        .build();

    for entry in walker.flatten() {
        if entry.file_type().is_some_and(|ft| ft.is_file()) {
            let path = entry.path();
            if is_ts_file(path) {
                if let Ok(meta) = std::fs::metadata(path) {
                    if let Ok(mtime) = meta.modified() {
                        if mtime > idx_mtime {
                            return true;
                        }
                    }
                }
            }
        }
    }

    false
}

/// Load existing index or rebuild if stale.
pub fn load_or_rebuild(scope: &Path) -> Result<DedupIndex, String> {
    if !is_stale(scope) {
        // Try to load existing
        let idx_path = index_path(scope);
        if let Ok(content) = std::fs::read_to_string(&idx_path) {
            if let Ok(index) = serde_json::from_str::<DedupIndex>(&content) {
                return Ok(index);
            }
        }
    }

    // Rebuild
    let _count = rebuild_index(scope)?;
    // Load the freshly-built index
    let idx_path = index_path(scope);
    let content =
        std::fs::read_to_string(&idx_path).map_err(|e| format!("failed to read index: {e}"))?;
    serde_json::from_str(&content).map_err(|e| format!("failed to parse index: {e}"))
}

/// Rebuild the index for a given scope. Returns the number of exports indexed.
pub fn rebuild_index(scope: &Path) -> Result<usize, String> {
    let mut all_exports: Vec<IndexedExport> = Vec::new();

    let walker = WalkBuilder::new(scope)
        .hidden(false)
        .git_ignore(true)
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !matches!(
                name.as_ref(),
                "node_modules" | ".git" | "dist" | "build" | "out" | ".cache" | "target"
            )
        })
        .build();

    for entry in walker.flatten() {
        if entry.file_type().is_some_and(|ft| ft.is_file()) {
            let path = entry.path();
            if is_ts_file(path) && !is_test_file(path) && !is_declaration_file(path) {
                let exports = crate::scan::extract_exports(path, scope);
                all_exports.extend(exports.into_iter().map(IndexedExport::from));
            }
        }
    }

    let count = all_exports.len();

    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let index = DedupIndex {
        built_at: now,
        scope_root: scope.to_string_lossy().to_string(),
        exports: all_exports,
    };

    // Write the index
    let idx_path = index_path(scope);
    if let Some(parent) = idx_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("failed to create .vybekiit dir: {e}"))?;
    }
    let content =
        serde_json::to_string_pretty(&index).map_err(|e| format!("failed to serialize: {e}"))?;
    std::fs::write(&idx_path, content).map_err(|e| format!("failed to write index: {e}"))?;

    Ok(count)
}

fn is_ts_file(path: &Path) -> bool {
    path.extension()
        .is_some_and(|ext| ext == "ts" || ext == "tsx" || ext == "js" || ext == "jsx")
}

fn is_test_file(path: &Path) -> bool {
    let name = path.file_name().unwrap_or_default().to_string_lossy();
    name.contains(".test.") || name.contains(".spec.") || name.contains("__tests__")
}

fn is_declaration_file(path: &Path) -> bool {
    let name = path.file_name().unwrap_or_default().to_string_lossy();
    name.ends_with(".d.ts")
}
