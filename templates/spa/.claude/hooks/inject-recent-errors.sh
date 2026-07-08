#!/usr/bin/env bash
# PRIORITY: 5 — Inject recent test failures on session start
# VybeKiit Hook: SessionStart
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 5

FAILURES=".vybekiit/test-failures.jsonl"
[[ -f "$FAILURES" ]] || exit 0

# Show last 3 failures only (tight context budget)
RECENT=$(tail -3 "$FAILURES" | jq -r '"\(.cmd): \(.err)"' 2>/dev/null | head -c 300)
[[ -z "$RECENT" ]] && exit 0

vybekiit_warn "Recent failures: $RECENT"
exit 0
