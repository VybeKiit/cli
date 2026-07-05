#!/usr/bin/env bash
# PRIORITY: 9 — Auto-sort package.json deps (silent, zero context)
# VybeKiit Hook: PostToolUse (Write|Edit)
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 9
vybekiit_parse_input

echo "$HOOK_FILE_PATH" | grep -qE 'package\.json$' || exit 0
[[ -f "$HOOK_FILE_PATH" ]] || exit 0
command -v jq &>/dev/null || exit 0

# Auto-sort silently
TMP=$(mktemp)
jq '
  if .dependencies then .dependencies |= (to_entries | sort_by(.key) | from_entries) else . end |
  if .devDependencies then .devDependencies |= (to_entries | sort_by(.key) | from_entries) else . end
' "$HOOK_FILE_PATH" > "$TMP" 2>/dev/null && mv "$TMP" "$HOOK_FILE_PATH" || rm -f "$TMP"

# NEVER produce output
exit 0
