#!/usr/bin/env bash
# PRIORITY: 7 — Block deep relative imports (../../..)
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 7
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0

if echo "$HOOK_CONTENT" | grep -qE "from ['\"]\.\.\/\.\.\/\.\.\/"; then
  vybekiit_block "Deep relative imports (../../..) are fragile. Use @/ path alias instead."
fi

exit 0
