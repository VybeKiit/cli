#!/usr/bin/env bash
# PRIORITY: 8 — Remind to export from barrel index.ts
# VybeKiit Hook: PostToolUse (Write|Edit)
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 8
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0
echo "$HOOK_FILE_PATH" | grep -qE 'index\.(ts|tsx|js|jsx)$' && exit 0

DIR=$(dirname "$HOOK_FILE_PATH")
BARREL="$DIR/index.ts"
[[ -f "$BARREL" ]] || exit 0

BASENAME=$(basename "$HOOK_FILE_PATH" | sed -E 's/\.(tsx|ts|jsx|js)$//')
grep -q "$BASENAME" "$BARREL" 2>/dev/null && exit 0

vybekiit_warn "📦 Export from barrel: export * from './$BASENAME'"
exit 0
