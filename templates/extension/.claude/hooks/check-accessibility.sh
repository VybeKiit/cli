#!/usr/bin/env bash
# PRIORITY: 6 — Check interactive elements have aria-labels
# VybeKiit Hook: PreToolUse (Write)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 6
vybekiit_parse_input

[[ -z "$HOOK_CONTENT" ]] && exit 0
echo "$HOOK_FILE_PATH" | grep -qE '\.(tsx|jsx)$' || exit 0

# Icon buttons without aria-label
if echo "$HOOK_CONTENT" | grep -qE '<button[^>]*>[^<]*<(Icon|Svg|img)' && ! echo "$HOOK_CONTENT" | grep -q 'aria-label'; then
  vybekiit_block "Interactive element without aria-label. Add accessibility props."
fi

# Images without alt
if echo "$HOOK_CONTENT" | grep -qE '<img\s' | grep -v 'alt='; then
  vybekiit_block "Image without alt text. Add alt=\"description\" for accessibility."
fi

exit 0
