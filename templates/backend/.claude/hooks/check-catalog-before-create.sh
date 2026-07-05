#!/usr/bin/env bash
# PRIORITY: 3 — Check for similar files before creating new ones
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 3
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" ]] && exit 0

# Only on new file creation
[[ -f "$HOOK_FILE_PATH" ]] && exit 0

DIR=$(dirname "$HOOK_FILE_PATH")
BASE=$(basename "$HOOK_FILE_PATH" | sed -E 's/\.(tsx|ts|jsx|js)$//')

[[ -z "$BASE" || ! -d "$DIR" ]] && exit 0

SIMILAR=$(find "$DIR" -maxdepth 1 -iname "${BASE}*" -not -name "$(basename "$HOOK_FILE_PATH")" 2>/dev/null | head -3)
if [[ -n "$SIMILAR" ]]; then
  vybekiit_block "Similar file(s) exist: $(echo "$SIMILAR" | tr '\n' ' '). Check before creating duplicates."
fi

exit 0
