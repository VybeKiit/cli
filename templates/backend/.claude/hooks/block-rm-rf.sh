#!/usr/bin/env bash
# PRIORITY: 1 — Block recursive force-delete commands
# VybeKiit Hook: PreToolUse (Bash)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 1
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0

if echo "$HOOK_COMMAND" | grep -qE 'rm\s+-[a-zA-Z]*r[a-zA-Z]*f|rm\s+-[a-zA-Z]*f[a-zA-Z]*r'; then
  # Allow node_modules, dist, .next, target (safe build artifacts)
  if echo "$HOOK_COMMAND" | grep -qE '(node_modules|dist|\.next|\.turbo|target|\.cache|build)'; then
    exit 0
  fi
  vybekiit_block "rm -rf blocked. Use targeted removal or specify safe directory."
fi

exit 0
