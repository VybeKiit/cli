use serde::{Deserialize, Serialize};

/// A single dedup match found by the detection engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DedupMatch {
    /// Detection level: "A" (exact/near-exact), "B" (structural), "D" (concern overlap)
    pub level: String,
    /// Existing symbol location: "file/path.ts:exportName"
    pub existing: String,
    /// Similarity score 0.0–1.0
    pub similarity: f64,
    /// Human-readable suggestion
    pub suggestion: String,
}

/// The top-level response from a dedup check.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum DedupResult {
    #[serde(rename = "clear")]
    Clear { checked: usize },
    #[serde(rename = "blocked")]
    Blocked {
        total: usize,
        showing: usize,
        matches: Vec<DedupMatch>,
    },
}

/// Result of an index rebuild operation.
#[derive(Debug, Serialize, Deserialize)]
pub struct IndexResult {
    pub indexed: usize,
}

/// Print a result as JSON or human-readable.
pub fn print_result(value: &serde_json::Value, json_mode: bool) {
    if json_mode {
        println!("{}", serde_json::to_string_pretty(value).unwrap());
    } else {
        // Human-readable output to stderr, JSON to stdout for piping
        match value.get("status").and_then(|s| s.as_str()) {
            Some("clear") => {
                let checked = value.get("checked").and_then(|c| c.as_u64()).unwrap_or(0);
                eprintln!("✅ Clear — checked {checked} exports, no duplicates found.");
            }
            Some("blocked") => {
                let total = value.get("total").and_then(|t| t.as_u64()).unwrap_or(0);
                let matches = value.get("matches").and_then(|m| m.as_array());
                eprintln!("🚫 Blocked — {total} duplicate(s) found:");
                if let Some(matches) = matches {
                    for m in matches {
                        let level = m.get("level").and_then(|l| l.as_str()).unwrap_or("?");
                        let existing = m.get("existing").and_then(|e| e.as_str()).unwrap_or("?");
                        let similarity = m.get("similarity").and_then(|s| s.as_f64()).unwrap_or(0.0);
                        let suggestion =
                            m.get("suggestion").and_then(|s| s.as_str()).unwrap_or("");
                        eprintln!(
                            "  [{level}] {existing} ({:.0}% similar)",
                            similarity * 100.0
                        );
                        eprintln!("      → {suggestion}");
                    }
                }
            }
            _ => {
                // Index result or unknown
                if let Some(indexed) = value.get("indexed").and_then(|i| i.as_u64()) {
                    eprintln!("📇 Index rebuilt — {indexed} exports indexed.");
                } else {
                    println!("{}", serde_json::to_string_pretty(value).unwrap());
                }
            }
        }
        // Always output JSON to stdout for machine consumption
        println!("{}", serde_json::to_string(value).unwrap());
    }
}
