#!/usr/bin/env bash
# PRIORITY: 3 — Silently capture test failures (zero context)
# VybeKiit Hook: PostToolUse (Bash)
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 3
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0

# Only test commands
echo "$HOOK_COMMAND" | grep -qE '(vitest|jest|mocha|pytest|cargo test|go test|pnpm test|npm test|yarn test|bun test)' || exit 0

# Get exit code from the hook input
EXIT_CODE=$(echo "$_HOOK_INPUT" | jq -r '.exit_code // empty' 2>/dev/null || echo "0")
[[ "$EXIT_CODE" = "0" || -z "$EXIT_CODE" ]] && exit 0

# Capture failure
STDERR=$(echo "$_HOOK_INPUT" | jq -r '.stderr // empty' 2>/dev/null | tail -10 | head -c 300 | sed 's/"/\\"/g')
mkdir -p .vybekiit 2>/dev/null || true
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"cmd\":\"$HOOK_COMMAND\",\"exit\":$EXIT_CODE,\"err\":\"$STDERR\"}" >> .vybekiit/test-failures.jsonl

# NEVER produce output
exit 0
