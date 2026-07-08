use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use tempfile::TempDir;

/// Helper: create a test project with some TS files
fn setup_project() -> TempDir {
    let dir = TempDir::new().unwrap();

    // Create a packages/payments structure
    let payments_dir = dir.path().join("packages/payments/src");
    fs::create_dir_all(&payments_dir).unwrap();
    fs::write(
        payments_dir.join("checkout.ts"),
        r#"
export function createCheckout(productId: string, amount: number) {
    return { productId, amount, url: `https://pay.example.com/${productId}` };
}

export function formatPrice(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
}
"#,
    )
    .unwrap();

    // Create packages/auth
    let auth_dir = dir.path().join("packages/auth/src");
    fs::create_dir_all(&auth_dir).unwrap();
    fs::write(
        auth_dir.join("validate.ts"),
        r#"
export function validateEmail(email: string): boolean {
    return email.includes('@') && email.includes('.');
}

export function hashPassword(password: string): string {
    return `hashed_${password}`;
}
"#,
    )
    .unwrap();

    // Create domain map
    let vybekiit_dir = dir.path().join(".vybekiit");
    fs::create_dir_all(&vybekiit_dir).unwrap();
    fs::write(
        vybekiit_dir.join("domain-map.json"),
        r#"{
  "domains": {
    "payment": { "home": "packages/payments" },
    "checkout": { "home": "packages/payments" },
    "auth": { "home": "packages/auth" },
    "email": { "home": "packages/auth" }
  }
}"#,
    )
    .unwrap();

    dir
}

// ═══════════════════════════════════════════════════
// E2E: Index building
// ═══════════════════════════════════════════════════

#[test]
fn e2e_index_command_creates_index() {
    let project = setup_project();

    Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--index", "--scope"])
        .arg(project.path())
        .arg("--json")
        .assert()
        .success()
        .stdout(predicate::str::contains("indexed"));
}

#[test]
fn e2e_index_counts_exports_correctly() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--index", "--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    // 4 exports: createCheckout, formatPrice, validateEmail, hashPassword
    assert_eq!(json["indexed"].as_u64().unwrap(), 4);
}

// ═══════════════════════════════════════════════════
// E2E: Clear status (no duplicates)
// ═══════════════════════════════════════════════════

#[test]
fn e2e_unique_intent_returns_clear() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "upload avatar image", "--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "clear");
    assert!(output.status.success());
}

#[test]
fn e2e_clear_exit_code_is_zero() {
    let project = setup_project();

    Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "completely unique feature xyz", "--scope"])
        .arg(project.path())
        .arg("--json")
        .assert()
        .code(0);
}

// ═══════════════════════════════════════════════════
// E2E: Blocked status (duplicates found)
// ═══════════════════════════════════════════════════

#[test]
fn e2e_payment_intent_blocked_by_domain_map() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "payment processing handler", "--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    assert!(!output.status.success()); // exit code 1
    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "blocked");
    let matches = json["matches"].as_array().unwrap();
    assert!(matches.iter().any(|m| m["existing"]
        .as_str()
        .unwrap()
        .contains("packages/payments")));
}

#[test]
fn e2e_auth_intent_blocked_by_domain_map() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "auth login validator", "--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    assert!(!output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "blocked");
    let matches = json["matches"].as_array().unwrap();
    assert!(matches.iter().any(|m| m["existing"]
        .as_str()
        .unwrap()
        .contains("packages/auth")));
}

#[test]
fn e2e_similar_name_blocked_level_a() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "format price", "--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    assert!(!output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "blocked");
    let matches = json["matches"].as_array().unwrap();
    assert!(matches.iter().any(|m| {
        m["level"].as_str().unwrap() == "A"
            && m["existing"].as_str().unwrap().contains("formatPrice")
    }));
}

// ═══════════════════════════════════════════════════
// E2E: Target file with exact duplicate
// ═══════════════════════════════════════════════════

#[test]
fn e2e_target_exact_duplicate_blocked() {
    let project = setup_project();

    // Create a duplicate file
    let dup_dir = project.path().join("src/utils");
    fs::create_dir_all(&dup_dir).unwrap();
    fs::write(
        dup_dir.join("payments.ts"),
        r#"
export function formatPrice(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
}
"#,
    )
    .unwrap();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--target"])
        .arg(dup_dir.join("payments.ts"))
        .args(["--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    assert!(!output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "blocked");
    // Should find exact body hash match (Level A)
    let matches = json["matches"].as_array().unwrap();
    assert!(matches.iter().any(|m| m["similarity"].as_f64().unwrap() == 1.0));
}

// ═══════════════════════════════════════════════════
// E2E: Pagination and limits
// ═══════════════════════════════════════════════════

#[test]
fn e2e_limit_restricts_results() {
    let project = setup_project();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "payment checkout email auth", "--scope"])
        .arg(project.path())
        .args(["--limit", "1", "--json"])
        .output()
        .unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
        if let Some(matches) = json.get("matches").and_then(|m| m.as_array()) {
            assert!(matches.len() <= 1);
        }
    }
}

// ═══════════════════════════════════════════════════
// E2E: Target file in correct home — Level D is suppressed
// ═══════════════════════════════════════════════════

#[test]
fn e2e_target_in_home_level_d_suppressed() {
    let project = setup_project();

    // Create a new file IN the payments package (the right home)
    let new_file = project.path().join("packages/payments/src/newWebhook.ts");
    fs::write(
        &new_file,
        r#"export function handlePaymentWebhook(body: unknown) { return body; }"#,
    )
    .unwrap();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--intent", "payment webhook", "--target"])
        .arg(&new_file)
        .args(["--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    // Level D should NOT fire (target is in the correct home)
    if let Some(matches) = json.get("matches").and_then(|m| m.as_array()) {
        let level_d: Vec<_> = matches
            .iter()
            .filter(|m| m["level"].as_str().unwrap_or("") == "D")
            .collect();
        assert!(level_d.is_empty(), "Level D should not fire for files in their home");
    }
}

// ═══════════════════════════════════════════════════
// E2E: Error handling
// ═══════════════════════════════════════════════════

#[test]
fn e2e_no_intent_or_target_exits_with_error() {
    Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--scope", "/tmp"])
        .arg("--json")
        .assert()
        .failure()
        .stderr(predicate::str::contains("provide --intent or --target"));
}

// ═══════════════════════════════════════════════════
// E2E: Structural detection (Level B) with exact dup
// ═══════════════════════════════════════════════════

#[test]
fn e2e_exact_body_duplicate_caught_via_target() {
    let project = setup_project();

    // Create a file with exact same body as formatPrice
    let dup_dir = project.path().join("src/lib");
    fs::create_dir_all(&dup_dir).unwrap();
    fs::write(
        dup_dir.join("formatter.ts"),
        r#"
export function formatPrice(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
}
"#,
    )
    .unwrap();

    let output = Command::cargo_bin("vybekiit-dedup")
        .unwrap()
        .args(["--target"])
        .arg(dup_dir.join("formatter.ts"))
        .args(["--scope"])
        .arg(project.path())
        .arg("--json")
        .output()
        .unwrap();

    assert!(!output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let json: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(json["status"].as_str().unwrap(), "blocked");
    // Should catch as exact duplicate (Level A, similarity 1.0)
    let matches = json["matches"].as_array().unwrap();
    let exact = matches
        .iter()
        .find(|m| m["similarity"].as_f64().unwrap() == 1.0);
    assert!(exact.is_some(), "Should find an exact body match");
    assert!(exact.unwrap()["existing"]
        .as_str()
        .unwrap()
        .contains("formatPrice"));
}
