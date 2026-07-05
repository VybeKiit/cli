#!/usr/bin/env bash
# PRIORITY: 4 — Block 'any' type annotations
# VybeKiit Hook: PreToolUse (Write|Edit)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 4
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx)$' || exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.d\.ts$|\.(test|spec)\.' && exit 0

if echo "$HOOK_CONTENT" | grep -vE '^\s*//' | grep -qE ':\s*any\b|<any>|as\s+any\b'; then
  vybekiit_block "'any' type detected. Use unknown + type guards, or the actual type from your schema."
fi

exit 0
