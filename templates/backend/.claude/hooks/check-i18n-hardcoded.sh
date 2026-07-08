#!/usr/bin/env bash
# PRIORITY: 7 — Warn on hardcoded user-facing strings
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 7
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(tsx|jsx)$' || exit 0

# Multi-word English strings between JSX tags
if echo "$HOOK_CONTENT" | grep -qE '>\s*[A-Z][a-z]{3,}(\s+[a-z]+){2,}\s*<'; then
  vybekiit_block "Hardcoded user-facing strings detected. Consider i18n: t('key.name')"
fi

exit 0
