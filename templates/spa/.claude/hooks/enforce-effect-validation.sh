#!/usr/bin/env bash
# PRIORITY: 4 — Block Zod, enforce @effect/schema
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 4
vybekiit_parse_input

[[ -z "$HOOK_FILE_PATH" || -z "$HOOK_CONTENT" ]] && exit 0

# Only check TS files in API/validation paths
if ! echo "$HOOK_FILE_PATH" | grep -qE '\.(ts|tsx)$'; then exit 0; fi

# Block zod imports
if echo "$HOOK_CONTENT" | grep -qE "from ['\"]zod['\"]|require\(['\"]zod['\"]"; then
  vybekiit_block "Use @effect/schema instead of Zod. Import: import { Schema } from '@effect/schema'"
fi

exit 0
