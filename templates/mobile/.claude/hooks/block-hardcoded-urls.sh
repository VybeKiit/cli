#!/usr/bin/env bash
# PRIORITY: 4 — Block hardcoded URLs in source
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 4
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(test|spec|config)\.|\.env|README' && exit 0

if echo "$HOOK_CONTENT" | grep -vE '^\s*//' | grep -qE 'http://(localhost|127\.0\.0\.1):[0-9]+|https?://[a-z]+\.(vercel\.app|netlify\.app|railway\.app|fly\.dev)'; then
  vybekiit_block "Hardcoded URL detected. Use environment variables for environment-specific URLs."
fi

exit 0
