#!/usr/bin/env bash
# PRIORITY: 5 — Warn about async without error handling
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 5
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(test|spec)\.' && exit 0

HAS_ASYNC=$(echo "$HOOK_CONTENT" | grep -c 'async\s' || true)
HAS_HANDLING=$(echo "$HOOK_CONTENT" | grep -cE 'try\s*\{|\.catch\(|Effect\.(catchAll|tryPromise|catchTag)|\.pipe\(' || true)

if [[ "$HAS_ASYNC" -gt 0 && "$HAS_HANDLING" -eq 0 ]]; then
  vybekiit_block "Async code without error handling. Use Effect.tryPromise or try/catch."
fi

exit 0
