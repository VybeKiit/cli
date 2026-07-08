#!/usr/bin/env bash
# PRIORITY: 2 — Block server env vars in client code
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 2
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || -z "$HOOK_CONTENT" ]] && exit 0

# Only check client-side files
IS_CLIENT=false
if echo "$HOOK_FILE_PATH" | grep -qE 'components/|app/.*page\.(tsx|jsx)$|pages/'; then IS_CLIENT=true; fi
if echo "$HOOK_CONTENT" | head -3 | grep -qE "^['\"]use client['\"]"; then IS_CLIENT=true; fi
# Skip server files
if echo "$HOOK_FILE_PATH" | grep -qE '\.server\.|/api/|/server/|route\.(ts|js)$'; then exit 0; fi

[[ "$IS_CLIENT" = false ]] && exit 0

# Check for server-only env access
if echo "$HOOK_CONTENT" | grep -E 'process\.env\.' | grep -vqE 'NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_|NODE_ENV'; then
  vybekiit_block "Server env var in client code. Use NEXT_PUBLIC_/VITE_/EXPO_PUBLIC_ prefix or move to server."
fi

exit 0
