#!/usr/bin/env bash
# PRIORITY: 6 — Enforce file naming conventions (new files only)
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 6
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" ]] && exit 0
# Only check new files
[[ -f "$HOOK_FILE_PATH" ]] && exit 0

BASENAME=$(basename "$HOOK_FILE_PATH" | sed -E 's/\.(tsx|ts|jsx|js)$//')

# Components → PascalCase
if echo "$HOOK_FILE_PATH" | grep -qE 'components/'; then
  if ! echo "$BASENAME" | grep -qE '^[A-Z][a-zA-Z0-9]+$'; then
    vybekiit_block "Component files must be PascalCase (e.g. UserProfile.tsx), got: $BASENAME"
  fi
fi

# Hooks → useXxx
if echo "$HOOK_FILE_PATH" | grep -qE 'hooks/'; then
  if ! echo "$BASENAME" | grep -qE '^use[A-Z]'; then
    vybekiit_block "Hook files must start with 'use' (e.g. useAuth.ts), got: $BASENAME"
  fi
fi

exit 0
