#!/usr/bin/env bash
# PRIORITY: 5 — Warn if file exceeds 300 lines
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 5
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx|py|rs|go)$' || exit 0
echo "$HOOK_FILE_PATH" | grep -qE 'generated|\.d\.ts$|schema\.prisma' && exit 0

LINE_COUNT=$(echo "$HOOK_CONTENT" | wc -l | tr -d ' ')
if [[ "$LINE_COUNT" -gt 300 ]]; then
  vybekiit_block "File is ${LINE_COUNT} lines (max 300). Split into smaller modules."
fi

exit 0
