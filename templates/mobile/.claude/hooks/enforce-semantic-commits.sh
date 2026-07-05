#!/usr/bin/env bash
# PRIORITY: 7 — Enforce conventional commit format
# VybeKiit Hook: PreToolUse (Bash)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 7
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0
echo "$HOOK_COMMAND" | grep -qE 'git\s+commit\s' || exit 0

# Extract commit message (-m "msg" or -m 'msg')
MSG=$(echo "$HOOK_COMMAND" | sed -n 's/.*-m ["\x27]\([^"\x27]*\)["\x27].*/\1/p' 2>/dev/null || echo "")
[[ -z "$MSG" ]] && MSG=$(echo "$HOOK_COMMAND" | sed -n 's/.*-m \([^ ]*\).*/\1/p' 2>/dev/null || echo "")
[[ -z "$MSG" ]] && exit 0

if ! echo "$MSG" | grep -qE '^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?!?:\s'; then
  vybekiit_block "Use conventional commits: feat|fix|chore|docs(scope): message"
fi

exit 0
