#!/usr/bin/env bash
# PRIORITY: 1 — Block push to main/master and force pushes
# VybeKiit Hook: PreToolUse (Bash)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 1
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0

if echo "$HOOK_COMMAND" | grep -qE 'git\s+push.*(\s|/)(main|master)(\s|$)'; then
  vybekiit_block "Direct push to main/master blocked. Use a feature branch + PR."
fi

if echo "$HOOK_COMMAND" | grep -qE 'git\s+push\s+.*--force'; then
  vybekiit_block "Force push blocked. Use --force-with-lease if you must."
fi

exit 0
