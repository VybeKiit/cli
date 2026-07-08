#!/usr/bin/env bash
# PRIORITY: 1 — Block secrets/tokens in source files
# VybeKiit Hook: PreToolUse (Write|Edit)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 1
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" ]] && exit 0

# Allow .env files
if echo "$HOOK_FILE_PATH" | grep -qE '\.env(\.|$)'; then
  exit 0
fi

[[ -z "$HOOK_CONTENT" ]] && exit 0

# Check for secret patterns
if echo "$HOOK_CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9-]{20,}|ghp_[a-zA-Z0-9]{36}|-----BEGIN (RSA |EC )?PRIVATE KEY|xox[boaprs]-[0-9a-zA-Z-]+|AIza[0-9A-Za-z_-]{35}'; then
  vybekiit_block "Secret/token detected in source. Use env vars or a secrets manager."
fi

exit 0
