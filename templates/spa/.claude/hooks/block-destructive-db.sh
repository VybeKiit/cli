#!/usr/bin/env bash
# PRIORITY: 1 — Block destructive database operations
# VybeKiit Hook: PreToolUse (Bash)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 1
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0

if echo "$HOOK_COMMAND" | grep -iqE 'DROP\s+(DATABASE|TABLE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\S+\s*$|db\s+drop|prisma\s+migrate\s+reset'; then
  vybekiit_block "Destructive DB operation blocked (DROP/TRUNCATE/unfiltered DELETE). Use migration or add WHERE."
fi

exit 0
