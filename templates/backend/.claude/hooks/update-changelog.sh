#!/usr/bin/env bash
# PRIORITY: 8 — Remind to update CHANGELOG for user-facing changes
# VybeKiit Hook: Stop
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 8

[[ -f "CHANGELOG.md" ]] || exit 0

# Check if changelog was already updated
CHANGELOG_CHANGED=$(git diff --cached --name-only 2>/dev/null | grep -i changelog || true)
[[ -n "$CHANGELOG_CHANGED" ]] && exit 0

# Check if there are meaningful source changes
MEANINGFUL=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | wc -l | tr -d ' ')
[[ "$MEANINGFUL" -lt 2 ]] && exit 0

vybekiit_stop_continue "Consider updating CHANGELOG.md if these changes are user-facing."
exit 0
