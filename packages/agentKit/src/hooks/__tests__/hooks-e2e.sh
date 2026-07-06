#!/usr/bin/env bash
# =============================================================================
# VybeKiit Hooks E2E Test Suite
# Tests all hooks for pass/violation behavior and priority gating
# Usage: bash hooks-e2e.sh
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# =============================================================================
# Test Helper
# =============================================================================

run_hook_test() {
  local hook_name="$1"
  local description="$2"
  local input_json="$3"
  local expect_exit="$4"       # 0 or nonzero
  local expect_block="$5"      # "yes" = block JSON, "no" = zero stdout, "nocrash" = anything ok
  local env_vars="${6:-}"

  local hook_path="$HOOKS_DIR/$hook_name"

  if [[ ! -f "$hook_path" ]]; then
    echo -e "  ${YELLOW}SKIP${NC} $hook_name — $description (file not found)"
    ((SKIP_COUNT++))
    return
  fi

  local output=""
  local exit_code=0

  if [[ -n "$env_vars" ]]; then
    output=$(echo "$input_json" | env $env_vars bash "$hook_path" 2>/dev/null) || exit_code=$?
  else
    output=$(echo "$input_json" | bash "$hook_path" 2>/dev/null) || exit_code=$?
  fi

  # Check expectations
  if [[ "$expect_block" == "yes" ]]; then
    if echo "$output" | grep -q '"decision"'; then
      echo -e "  ${GREEN}PASS${NC} $hook_name — $description"
      ((PASS_COUNT++))
    else
      echo -e "  ${RED}FAIL${NC} $hook_name — $description"
      echo "       Expected block JSON, got: $(echo "$output" | head -c 100)"
      ((FAIL_COUNT++))
    fi
  elif [[ "$expect_block" == "no" ]]; then
    if [[ -z "$output" ]]; then
      echo -e "  ${GREEN}PASS${NC} $hook_name — $description"
      ((PASS_COUNT++))
    else
      echo -e "  ${RED}FAIL${NC} $hook_name — $description"
      echo "       Expected zero output, got ${#output} bytes: $(echo "$output" | head -c 80)"
      ((FAIL_COUNT++))
    fi
  elif [[ "$expect_block" == "nocrash" ]]; then
    echo -e "  ${GREEN}PASS${NC} $hook_name — $description (exit=$exit_code, ${#output} bytes)"
    ((PASS_COUNT++))
  fi
}

# =============================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  VybeKiit Hooks E2E Test Suite${NC}"
echo -e "${CYAN}  Hooks: $HOOKS_DIR${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ---------------------------------------------------------------------------
# P1 — Critical
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P1 Hooks (Critical)${NC}"

run_hook_test "block-push-to-main.sh" \
  "PASS: push to feature branch" \
  '{"tool_input":{"command":"git push origin feature/xyz"}}' \
  "0" "no"

run_hook_test "block-push-to-main.sh" \
  "BLOCK: push to main" \
  '{"tool_input":{"command":"git push origin main"}}' \
  "0" "yes"

run_hook_test "block-push-to-main.sh" \
  "BLOCK: force push" \
  '{"tool_input":{"command":"git push --force origin dev"}}' \
  "0" "yes"

run_hook_test "block-rm-rf.sh" \
  "PASS: rm -rf node_modules" \
  '{"tool_input":{"command":"rm -rf node_modules"}}' \
  "0" "no"

run_hook_test "block-rm-rf.sh" \
  "PASS: rm -rf dist" \
  '{"tool_input":{"command":"rm -rf dist"}}' \
  "0" "no"

run_hook_test "block-rm-rf.sh" \
  "BLOCK: rm -rf /" \
  '{"tool_input":{"command":"rm -rf /"}}' \
  "0" "yes"

run_hook_test "block-rm-rf.sh" \
  "BLOCK: rm -rf src" \
  '{"tool_input":{"command":"rm -rf src"}}' \
  "0" "yes"

run_hook_test "block-destructive-db.sh" \
  "PASS: SELECT query" \
  '{"tool_input":{"command":"psql -c \"SELECT * FROM users WHERE id=1\""}}' \
  "0" "no"

run_hook_test "block-destructive-db.sh" \
  "BLOCK: DROP TABLE" \
  '{"tool_input":{"command":"psql -c \"DROP TABLE users\""}}' \
  "0" "yes"

run_hook_test "block-destructive-db.sh" \
  "BLOCK: TRUNCATE TABLE" \
  '{"tool_input":{"command":"psql -c \"TRUNCATE TABLE users\""}}' \
  "0" "yes"

run_hook_test "verify-before-done.sh" \
  "NOCRASH: Stop hook" \
  '{}' \
  "0" "nocrash"

run_hook_test "block-secrets-in-code.sh" \
  "PASS: normal code" \
  '{"tool_input":{"file_path":"src/app.ts","content":"const x = 42;"}}' \
  "0" "no"

run_hook_test "block-secrets-in-code.sh" \
  "PASS: .env file allowed" \
  '{"tool_input":{"file_path":".env.local","content":"SECRET_KEY=sk-proj-abc123def456ghi789jkl"}}' \
  "0" "no"

run_hook_test "block-secrets-in-code.sh" \
  "BLOCK: AWS key" \
  '{"tool_input":{"file_path":"src/config.ts","content":"const key = \"AKIAIOSFODNN7EXAMPLE\";"}}' \
  "0" "yes"

run_hook_test "block-secrets-in-code.sh" \
  "BLOCK: OpenAI key" \
  '{"tool_input":{"file_path":"src/ai.ts","content":"const key = \"sk-proj-abc123def456ghi789jkl\";"}}' \
  "0" "yes"

run_hook_test "block-secrets-in-code.sh" \
  "BLOCK: GitHub token" \
  '{"tool_input":{"file_path":"src/gh.ts","content":"const t = \"ghp_abcdefghijklmnopqrstuvwxyz1234567890\";"}}' \
  "0" "yes"

echo ""

# ---------------------------------------------------------------------------
# P2 — Important
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P2 Hooks (Important)${NC}"

run_hook_test "auto-format.sh" \
  "PASS: always silent" \
  '{"tool_input":{"file_path":"src/app.ts","content":"const x=1"}}' \
  "0" "no"

run_hook_test "block-install-unknown-deps.sh" \
  "PASS: normal package" \
  '{"tool_input":{"command":"npm install express"}}' \
  "0" "no"

run_hook_test "block-install-unknown-deps.sh" \
  "BLOCK: suspicious 2-char name" \
  '{"tool_input":{"command":"npm install ab"}}' \
  "0" "yes"

run_hook_test "block-install-unknown-deps.sh" \
  "PASS: scoped @tanstack" \
  '{"tool_input":{"command":"pnpm add @tanstack/react-query"}}' \
  "0" "no"

run_hook_test "block-env-in-client.sh" \
  "PASS: server file" \
  '{"tool_input":{"file_path":"src/api/route.ts","content":"const db = process.env.DATABASE_URL;"}}' \
  "0" "no"

run_hook_test "auto-open-issue.sh" \
  "PASS: exit 0 (no error)" \
  '{"tool_input":{"command":"npm test"},"exit_code":"0","stderr":"","stdout":"ok"}' \
  "0" "no"

echo ""

# ---------------------------------------------------------------------------
# P3 — Moderate
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P3 Hooks (Moderate)${NC}"

run_hook_test "check-catalog-before-create.sh" \
  "PASS: new file" \
  '{"tool_input":{"file_path":"src/components/BrandNewComponent.tsx","content":"export default function BrandNewComponent() {}"}}' \
  "0" "no"

run_hook_test "report-feedback.sh" \
  "NOCRASH: Stop hook" \
  '{}' \
  "0" "nocrash"

run_hook_test "capture-test-failures.sh" \
  "PASS: non-test command" \
  '{"tool_input":{"command":"ls -la"},"exit_code":"0","stderr":"","stdout":"files"}' \
  "0" "no"

run_hook_test "auto-request-skill.sh" \
  "PASS: normal successful command" \
  '{"tool_input":{"command":"cat src/app.ts"},"exit_code":"0","stderr":"","stdout":"code"}' \
  "0" "no"

run_hook_test "detect-missing-skill.sh" \
  "PASS: normal prompt" \
  '{"prompt":"fix the typo in utils.ts"}' \
  "0" "no"

echo ""

# ---------------------------------------------------------------------------
# P4 — Quality
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P4 Hooks (Quality)${NC}"

run_hook_test "enforce-effect-validation.sh" \
  "PASS: effect import" \
  '{"tool_input":{"file_path":"src/schema.ts","content":"import { Schema } from \"@effect/schema\";"}}' \
  "0" "no"

run_hook_test "enforce-effect-validation.sh" \
  "BLOCK: zod import" \
  '{"tool_input":{"file_path":"src/schema.ts","content":"import { z } from \"zod\";\nconst x = z.object({});"}}' \
  "0" "yes"

run_hook_test "enforce-types-no-any.sh" \
  "PASS: typed code" \
  '{"tool_input":{"file_path":"src/utils.ts","content":"function greet(name: string): string { return name; }"}}' \
  "0" "no"

run_hook_test "enforce-types-no-any.sh" \
  "BLOCK: any type" \
  '{"tool_input":{"file_path":"src/utils.ts","content":"function parse(data: any): any { return data; }"}}' \
  "0" "yes"

run_hook_test "enforce-types-no-any.sh" \
  "PASS: .d.ts allowed" \
  '{"tool_input":{"file_path":"src/types.d.ts","content":"declare const x: any;"}}' \
  "0" "no"

run_hook_test "block-hardcoded-urls.sh" \
  "PASS: env var" \
  '{"tool_input":{"file_path":"src/api.ts","content":"const url = process.env.API_URL;"}}' \
  "0" "no"

run_hook_test "block-hardcoded-urls.sh" \
  "BLOCK: vercel app URL" \
  '{"tool_input":{"file_path":"src/api.ts","content":"const url = \"https://myapp.vercel.app/api\";"}}' \
  "0" "yes"

echo ""

# ---------------------------------------------------------------------------
# P5 — Hygiene
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P5 Hooks (Hygiene)${NC}"

run_hook_test "enforce-effect-log.sh" \
  "PASS: Effect.log" \
  '{"tool_input":{"file_path":"src/service.ts","content":"import { Effect } from \"effect\";\nEffect.log(\"hello\");"}}' \
  "0" "no"

run_hook_test "enforce-effect-log.sh" \
  "BLOCK: console.log" \
  '{"tool_input":{"file_path":"src/service.ts","content":"console.log(\"debug\");\nexport const x = 1;"}}' \
  "0" "yes"

run_hook_test "enforce-effect-log.sh" \
  "PASS: test file allowed" \
  '{"tool_input":{"file_path":"src/service.test.ts","content":"console.log(\"debug test\");"}}' \
  "0" "no"

run_hook_test "enforce-error-handling.sh" \
  "PASS: async with try/catch" \
  '{"tool_input":{"file_path":"src/api.ts","content":"async function f() { try { await x(); } catch(e) {} }"}}' \
  "0" "no"

run_hook_test "enforce-error-handling.sh" \
  "BLOCK: async without handling" \
  '{"tool_input":{"file_path":"src/api.ts","content":"async function f() {\n  await fetch(\"/api\");\n  return 1;\n}"}}' \
  "0" "yes"

run_hook_test "enforce-file-size.sh" \
  "PASS: short file" \
  '{"tool_input":{"file_path":"src/small.ts","content":"const x = 1;\nexport default x;"}}' \
  "0" "no"

# Generate 310 lines for file-size violation test
LINES_310=$(python3 -c "import json; print(json.dumps({'tool_input':{'file_path':'src/huge.ts','content':'\n'.join(['const line'+str(i)+' = '+str(i)+';' for i in range(310)])}}))" 2>/dev/null || echo '{"tool_input":{"file_path":"src/huge.ts","content":""}}')
run_hook_test "enforce-file-size.sh" \
  "BLOCK: >300 lines" \
  "$LINES_310" \
  "0" "yes"

run_hook_test "inject-recent-errors.sh" \
  "PASS: no failures file" \
  '{"source":"startup"}' \
  "0" "no"

echo ""

# ---------------------------------------------------------------------------
# P6 — Polish
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P6 Hooks (Polish)${NC}"

run_hook_test "check-accessibility.sh" \
  "PASS: has aria-label" \
  '{"tool_input":{"file_path":"src/B.tsx","content":"<button aria-label=\"Close\">X</button>"}}' \
  "0" "no"

run_hook_test "check-import-cycle.sh" \
  "PASS: no file exists for cycle" \
  '{"tool_input":{"file_path":"src/utils.ts","content":"import { x } from \"./helpers\";"}}' \
  "0" "no"

run_hook_test "enforce-loading-states.sh" \
  "PASS: has loading + error" \
  '{"tool_input":{"file_path":"src/List.tsx","content":"const { data, isLoading, error } = useQuery();\nif (isLoading) return <Spinner/>;\nif (error) return <Error/>;"}}' \
  "0" "no"

run_hook_test "enforce-loading-states.sh" \
  "BLOCK: fetch without loading" \
  '{"tool_input":{"file_path":"src/List.tsx","content":"const { data } = useQuery();\nreturn <div>{data}</div>;"}}' \
  "0" "yes"

run_hook_test "enforce-naming-conventions.sh" \
  "BLOCK: lowercase component" \
  '{"tool_input":{"file_path":"src/components/button.tsx","content":"export function button() {}"}}' \
  "0" "yes"

echo ""

# ---------------------------------------------------------------------------
# P7 — Suggestions
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P7 Hooks (Suggestions)${NC}"

run_hook_test "block-relative-parent-imports.sh" \
  "PASS: @/ alias" \
  '{"tool_input":{"file_path":"src/deep/file.ts","content":"import { x } from \"@/utils\";"}}' \
  "0" "no"

run_hook_test "block-relative-parent-imports.sh" \
  "BLOCK: ../../.. import" \
  '{"tool_input":{"file_path":"src/deep/file.ts","content":"import { x } from \"../../../utils\";"}}' \
  "0" "yes"

run_hook_test "check-i18n-hardcoded.sh" \
  "PASS: uses t()" \
  '{"tool_input":{"file_path":"src/Page.tsx","content":"return <h1>{t(\"title\")}</h1>;"}}' \
  "0" "no"

run_hook_test "check-test-coverage.sh" \
  "NOCRASH: Stop hook" \
  '{}' \
  "0" "nocrash"

run_hook_test "enforce-semantic-commits.sh" \
  "PASS: conventional commit" \
  '{"tool_input":{"command":"git commit -m \"feat: add login\""}}' \
  "0" "no"

run_hook_test "enforce-semantic-commits.sh" \
  "BLOCK: bad commit msg" \
  '{"tool_input":{"command":"git commit -m \"fixed stuff\""}}' \
  "0" "yes"

echo ""

# ---------------------------------------------------------------------------
# P8/P9 — Reminders/Silent
# ---------------------------------------------------------------------------
echo -e "${YELLOW}▸ P8-P9 Hooks (Reminders/Silent)${NC}"

run_hook_test "check-dead-code.sh" \
  "NOCRASH: Stop hook" \
  '{}' \
  "0" "nocrash"

run_hook_test "enforce-barrel-exports.sh" \
  "PASS: no barrel index" \
  '{"tool_input":{"file_path":"src/components/Button.tsx","content":"export function Button() {}"}}' \
  "0" "no"

run_hook_test "update-changelog.sh" \
  "NOCRASH: Stop hook" \
  '{}' \
  "0" "nocrash"

run_hook_test "check-package-json-sorted.sh" \
  "PASS: always silent" \
  '{"tool_input":{"file_path":"package.json","content":"{\"dependencies\":{\"b\":\"1\",\"a\":\"2\"}}"}}' \
  "0" "no"

echo ""

# =============================================================================
# Priority Gating Tests
# =============================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Priority Gating Tests (VYBEKIIT_HOOK_LEVEL=minimal)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}▸ P1 should STILL block in minimal mode${NC}"

run_hook_test "block-push-to-main.sh" \
  "P1 BLOCKS: push to main" \
  '{"tool_input":{"command":"git push origin main"}}' \
  "0" "yes" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "block-secrets-in-code.sh" \
  "P1 BLOCKS: AWS key" \
  '{"tool_input":{"file_path":"src/x.ts","content":"const k = \"AKIAIOSFODNN7EXAMPLE\";"}}' \
  "0" "yes" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

echo ""
echo -e "${YELLOW}▸ P3+ should be SILENT in minimal mode (even with violations)${NC}"

run_hook_test "enforce-effect-validation.sh" \
  "P4 GATED: zod passes in minimal" \
  '{"tool_input":{"file_path":"src/x.ts","content":"import { z } from \"zod\";"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "enforce-types-no-any.sh" \
  "P4 GATED: any passes in minimal" \
  '{"tool_input":{"file_path":"src/x.ts","content":"function f(x: any) {}"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "enforce-effect-log.sh" \
  "P5 GATED: console.log passes in minimal" \
  '{"tool_input":{"file_path":"src/x.ts","content":"console.log(\"test\");"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "check-accessibility.sh" \
  "P6 GATED: no aria passes in minimal" \
  '{"tool_input":{"file_path":"src/B.tsx","content":"<button>X</button>"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "block-relative-parent-imports.sh" \
  "P7 GATED: deep import passes in minimal" \
  '{"tool_input":{"file_path":"src/x.ts","content":"import { x } from \"../../../y\";"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "check-dead-code.sh" \
  "P8 GATED: Stop hook silent in minimal" \
  '{}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

run_hook_test "check-package-json-sorted.sh" \
  "P9 GATED: sort skipped in minimal" \
  '{"tool_input":{"file_path":"package.json","content":"{}"}}' \
  "0" "no" \
  "VYBEKIIT_HOOK_LEVEL=minimal"

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
echo -e "  ${GREEN}PASSED: $PASS_COUNT${NC}  ${RED}FAILED: $FAIL_COUNT${NC}  ${YELLOW}SKIPPED: $SKIP_COUNT${NC}  TOTAL: $TOTAL"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

[[ $FAIL_COUNT -gt 0 ]] && exit 1
exit 0
