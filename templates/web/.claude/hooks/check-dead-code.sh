#!/usr/bin/env bash
# PRIORITY: 8 — Warn about unused imports in modified files
# VybeKiit Hook: Stop
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 8

MODIFIED=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | head -3)
[[ -z "$MODIFIED" ]] && exit 0

DEAD=""
while IFS= read -r file; do
  [[ -z "$file" || ! -f "$file" ]] && continue
  IMPORTS=$(grep -oE 'import\s+\{([^}]+)\}' "$file" 2>/dev/null | sed 's/import {//;s/}//;s/,/\n/g' | tr -d ' ' | grep -v '^$')
  while IFS= read -r sym; do
    [[ -z "$sym" ]] && continue
    USAGE=$(tail -n +10 "$file" | grep -c "\b${sym}\b" 2>/dev/null || echo "0")
    [[ "$USAGE" -eq 0 ]] && DEAD="${DEAD}${sym} "
  done <<< "$IMPORTS"
done <<< "$MODIFIED"

[[ -n "$DEAD" ]] && vybekiit_stop_continue "Unused imports: $DEAD"
exit 0
