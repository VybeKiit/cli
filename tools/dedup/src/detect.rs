use crate::index::DedupIndex;
use crate::output::DedupMatch;
use crate::scan::tokenize_identifier;
use serde::Deserialize;
use std::collections::HashMap;
use std::path::Path;

/// Domain map entry from .vybekiit/domain-map.json
#[derive(Debug, Deserialize)]
struct DomainMap {
    domains: HashMap<String, DomainEntry>,
}

#[derive(Debug, Deserialize)]
struct DomainEntry {
    home: String,
}

/// Run all detection levels and return matches sorted by similarity (descending).
pub fn run(
    index: &DedupIndex,
    intent: Option<&str>,
    target: Option<&Path>,
    scope: &Path,
) -> Vec<DedupMatch> {
    let mut matches: Vec<DedupMatch> = Vec::new();

    // If we have a target file, parse it for exports to compare
    let target_exports = target
        .filter(|t| t.exists())
        .map(|t| crate::scan::extract_exports(t, scope))
        .unwrap_or_default();

    // Level A: Exact/near-exact detection
    matches.extend(detect_level_a(index, intent, &target_exports));

    // Level B: Structural detection
    matches.extend(detect_level_b(index, &target_exports));

    // Level D: Concern overlap
    matches.extend(detect_level_d(index, intent, target, scope));

    // Deduplicate (same existing symbol shouldn't appear twice)
    matches.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap_or(std::cmp::Ordering::Equal));
    matches.dedup_by(|a, b| a.existing == b.existing);

    matches
}

/// Level A — Exact/near-exact detection.
/// Catches copy-pasted functions with trivial renames.
fn detect_level_a(
    index: &DedupIndex,
    intent: Option<&str>,
    target_exports: &[crate::scan::ExportedSymbol],
) -> Vec<DedupMatch> {
    let mut matches = Vec::new();

    // Check by intent (fuzzy name matching)
    if let Some(intent_str) = intent {
        let intent_tokens = tokenize_intent(intent_str);
        for export in &index.exports {
            let sim = token_similarity(&intent_tokens, &export.name_tokens);
            if sim >= 0.7 {
                matches.push(DedupMatch {
                    level: "A".to_string(),
                    existing: format!("{}:{}", export.file_path, export.name),
                    similarity: sim,
                    suggestion: format!("reuse or extend `{}` from {}", export.name, export.file_path),
                });
            }
        }
    }

    // Check by body hash (exact match)
    for target_sym in target_exports {
        if target_sym.body_hash == 0 {
            continue;
        }
        for export in &index.exports {
            if export.body_hash == target_sym.body_hash && export.file_path != target_sym.file_path {
                matches.push(DedupMatch {
                    level: "A".to_string(),
                    existing: format!("{}:{}", export.file_path, export.name),
                    similarity: 1.0,
                    suggestion: format!(
                        "exact duplicate of `{}` — import it instead",
                        export.name
                    ),
                });
            }
        }

        // Fuzzy name match against index
        let sim_threshold = 0.75;
        for export in &index.exports {
            if export.file_path == target_sym.file_path {
                continue;
            }
            let name_sim = name_similarity(&target_sym.name, &export.name);
            if name_sim >= sim_threshold {
                // Don't double-report exact body matches
                if export.body_hash == target_sym.body_hash {
                    continue;
                }
                matches.push(DedupMatch {
                    level: "A".to_string(),
                    existing: format!("{}:{}", export.file_path, export.name),
                    similarity: name_sim,
                    suggestion: format!(
                        "similar name to `{}` — verify it's not a duplicate",
                        export.name
                    ),
                });
            }
        }
    }

    matches
}

/// Level B — Structural detection.
/// Catches functions with the same shape (type skeleton + control flow) but different names.
fn detect_level_b(
    index: &DedupIndex,
    target_exports: &[crate::scan::ExportedSymbol],
) -> Vec<DedupMatch> {
    let mut matches = Vec::new();

    for target_sym in target_exports {
        if target_sym.skeleton_hash == 0 {
            continue;
        }
        for export in &index.exports {
            if export.file_path == target_sym.file_path {
                continue;
            }
            if export.skeleton_hash == target_sym.skeleton_hash
                && export.skeleton_hash != 0
                // Don't report if already caught by Level A (same body)
                && export.body_hash != target_sym.body_hash
            {
                matches.push(DedupMatch {
                    level: "B".to_string(),
                    existing: format!("{}:{}", export.file_path, export.name),
                    similarity: 0.85,
                    suggestion: format!(
                        "structurally identical to `{}` — same shape, different names. Consider generalizing",
                        export.name
                    ),
                });
            }
        }

        // Also check signature shape for near-structural matches
        if !target_sym.signature_shape.is_empty() && target_sym.signature_shape != "const:value" {
            for export in &index.exports {
                if export.file_path == target_sym.file_path {
                    continue;
                }
                if export.signature_shape == target_sym.signature_shape
                    && export.skeleton_hash != target_sym.skeleton_hash
                {
                    // Same signature shape but different body — check name overlap
                    let name_sim = token_similarity(&target_sym.name_tokens, &export.name_tokens);
                    if name_sim >= 0.5 {
                        matches.push(DedupMatch {
                            level: "B".to_string(),
                            existing: format!("{}:{}", export.file_path, export.name),
                            similarity: 0.6 + name_sim * 0.3,
                            suggestion: format!(
                                "same signature shape as `{}` with overlapping name — likely a variant that should be parameterized",
                                export.name
                            ),
                        });
                    }
                }
            }
        }
    }

    matches
}

/// Level D — Concern overlap detection.
/// Catches new files in a domain that already has an established home.
fn detect_level_d(
    index: &DedupIndex,
    intent: Option<&str>,
    target: Option<&Path>,
    scope: &Path,
) -> Vec<DedupMatch> {
    let mut matches = Vec::new();

    // Load domain map
    let domain_map = load_domain_map(scope);

    // Extract domain keywords from intent and target path
    let mut query_keywords: Vec<String> = Vec::new();

    if let Some(intent_str) = intent {
        query_keywords.extend(tokenize_intent(intent_str));
    }

    if let Some(target_path) = target {
        let path_str = target_path.to_string_lossy().to_lowercase();
        for segment in path_str.split('/') {
            let seg = segment
                .trim_end_matches(".ts")
                .trim_end_matches(".tsx");
            if !seg.is_empty()
                && !matches!(seg, "src" | "lib" | "utils" | "helpers" | "index")
            {
                query_keywords.push(seg.to_string());
            }
        }
    }

    if query_keywords.is_empty() {
        return matches;
    }

    // Check against domain map (explicit)
    if let Some(map) = &domain_map {
        for keyword in &query_keywords {
            if let Some(entry) = map.domains.get(keyword) {
                // Check if the target is NOT already in the home
                // Target may be absolute or relative; normalize to relative from scope
                let in_home = target
                    .map(|t| {
                        let relative = t.strip_prefix(scope).unwrap_or(t);
                        let relative_str = relative.to_string_lossy();
                        relative_str.starts_with(&entry.home)
                            || t.starts_with(scope.join(&entry.home))
                    })
                    .unwrap_or(false);

                if !in_home {
                    matches.push(DedupMatch {
                        level: "D".to_string(),
                        existing: entry.home.clone(),
                        similarity: 0.9,
                        suggestion: format!(
                            "domain '{}' already has a home at `{}` — place this code there",
                            keyword, entry.home
                        ),
                    });
                }
            }
        }
    }

    // Check against existing export names (inference fallback)
    for keyword in &query_keywords {
        for export in &index.exports {
            if export.domain_keywords.contains(keyword) {
                let target_path_str = target
                    .map(|t| t.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Only flag if the existing export is in a different directory subtree
                let export_dir = Path::new(&export.file_path)
                    .parent()
                    .unwrap_or(Path::new(""));
                let target_dir = Path::new(&target_path_str)
                    .parent()
                    .unwrap_or(Path::new(""));

                if !target_path_str.is_empty()
                    && export_dir != target_dir
                    && export.file_path.contains("packages/")
                {
                    let sim = keyword_overlap_score(&query_keywords, &export.domain_keywords);
                    if sim >= 0.6 {
                        matches.push(DedupMatch {
                            level: "D".to_string(),
                            existing: format!("{}:{}", export.file_path, export.name),
                            similarity: sim,
                            suggestion: format!(
                                "concern '{}' already has code at `{}` — extend it there",
                                keyword, export.file_path
                            ),
                        });
                        break; // One match per keyword is enough
                    }
                }
            }
        }
    }

    matches
}

// --- Helpers ---

/// Tokenize an intent string into lowercase keywords.
fn tokenize_intent(intent: &str) -> Vec<String> {
    intent
        .split_whitespace()
        .flat_map(|word| {
            // Split camelCase too
            let tokens = tokenize_identifier(word);
            tokens.into_iter()
        })
        .map(|t| t.to_lowercase())
        .filter(|t| !is_stop_word(t))
        .collect()
}

/// Common stop words to filter from intent matching.
fn is_stop_word(word: &str) -> bool {
    matches!(
        word,
        "a" | "an" | "the" | "for" | "to" | "from" | "with" | "in" | "on" | "of" | "and" | "or"
            | "is" | "are" | "was" | "were" | "be" | "been" | "being" | "have" | "has" | "had"
            | "do" | "does" | "did" | "will" | "would" | "could" | "should" | "may" | "might"
            | "shall" | "can" | "this" | "that" | "these" | "those" | "new" | "add" | "create"
    )
}

/// Compute name similarity using normalized Levenshtein distance.
fn name_similarity(a: &str, b: &str) -> f64 {
    let a_lower = a.to_lowercase();
    let b_lower = b.to_lowercase();
    1.0 - strsim::normalized_levenshtein(&a_lower, &b_lower)
        .min(1.0)
        .max(0.0)
}

/// Compute token-level similarity (Jaccard-like with order bonus).
fn token_similarity(a: &[String], b: &[String]) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }

    let a_set: std::collections::HashSet<&str> = a.iter().map(|s| s.as_str()).collect();
    let b_set: std::collections::HashSet<&str> = b.iter().map(|s| s.as_str()).collect();

    let intersection = a_set.intersection(&b_set).count() as f64;
    let union = a_set.union(&b_set).count() as f64;

    if union == 0.0 {
        return 0.0;
    }

    // Jaccard similarity with a bonus for partial matches (fuzzy token matching)
    let mut fuzzy_bonus = 0.0;
    for a_tok in &a_set {
        for b_tok in &b_set {
            if a_tok != b_tok {
                let sim = strsim::jaro_winkler(a_tok, b_tok);
                if sim > 0.85 {
                    fuzzy_bonus += 0.2;
                }
            }
        }
    }

    ((intersection / union) + fuzzy_bonus).min(1.0)
}

/// Compute keyword overlap score between two keyword sets.
fn keyword_overlap_score(query: &[String], existing: &[String]) -> f64 {
    if query.is_empty() || existing.is_empty() {
        return 0.0;
    }

    let matches = query
        .iter()
        .filter(|q| existing.iter().any(|e| e == *q || strsim::jaro_winkler(q, e) > 0.85))
        .count();

    matches as f64 / query.len().max(1) as f64
}

/// Load the domain map from .vybekiit/domain-map.json (or project root).
fn load_domain_map(scope: &Path) -> Option<DomainMap> {
    // Try scope-local first
    let local_path = scope.join(".vybekiit").join("domain-map.json");
    if let Ok(content) = std::fs::read_to_string(&local_path) {
        if let Ok(map) = serde_json::from_str::<DomainMap>(&content) {
            return Some(map);
        }
    }

    // Try walking up to find it
    let mut current = scope.to_path_buf();
    loop {
        let candidate = current.join(".vybekiit").join("domain-map.json");
        if let Ok(content) = std::fs::read_to_string(&candidate) {
            if let Ok(map) = serde_json::from_str::<DomainMap>(&content) {
                return Some(map);
            }
        }
        if !current.pop() {
            break;
        }
    }

    None
}
