#!/usr/bin/env bash
# PRIORITY: 7 — Remind to add tests for new source files
# VybeKiit Hook: Stop
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 7

# Get new source files from git
NEW_SRC=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -E 'src/.*\.(ts|tsx)$' | grep -vE '\.(test|spec|d)\.' | head -3)
[[ -z "$NEW_SRC" ]] && exit 0

MISSING=""
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  TEST="${f%.*}.test.${f##*.}"
  [[ ! -f "$TEST" ]] && MISSING="${MISSING}$(basename "$f") "
done <<< "$NEW_SRC"

[[ -n "$MISSING" ]] && vybekiit_stop_continue "New files without tests: $MISSING"
exit 0
