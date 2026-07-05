#!/usr/bin/env bash
# PRIORITY: 5 — Block console.log in prod source, use Effect.log
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 5
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0
# Allow in tests, scripts, CLI
echo "$HOOK_FILE_PATH" | grep -qE '\.(test|spec)\.|scripts/|cli/|__tests__/' && exit 0

if echo "$HOOK_CONTENT" | grep -vE '^\s*//' | grep -qE '^\s*console\.(log|warn|error|info)\('; then
  vybekiit_block "console.log in prod source. Use Effect.log/logWarning/logError instead."
fi

exit 0
