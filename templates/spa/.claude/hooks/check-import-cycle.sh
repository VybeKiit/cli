#!/usr/bin/env bash
# PRIORITY: 6 — Quick circular import check
# VybeKiit Hook: PostToolUse (Write|Edit)
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 6
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || ! -f "$HOOK_FILE_PATH" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0

DIR=$(dirname "$HOOK_FILE_PATH")
BASENAME=$(basename "$HOOK_FILE_PATH" | sed -E 's/\.(tsx|ts|jsx|js)$//')

# Get relative imports from this file
IMPORTS=$(grep -oE "from ['\"]\.\.?/[^'\"]+['\"]" "$HOOK_FILE_PATH" 2>/dev/null | sed "s/from ['\"]//;s/['\"]$//" || echo "")
[[ -z "$IMPORTS" ]] && exit 0

while IFS= read -r imp; do
  [[ -z "$imp" ]] && continue
  for ext in ts tsx js jsx; do
    RESOLVED="$DIR/$imp.$ext"
    if [[ -f "$RESOLVED" ]] && grep -q "$BASENAME" "$RESOLVED" 2>/dev/null; then
      vybekiit_warn "⚠️ Circular import: $(basename "$HOOK_FILE_PATH") ↔ $(basename "$RESOLVED")"
      exit 0
    fi
  done
done <<< "$IMPORTS"

exit 0
