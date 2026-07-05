#!/usr/bin/env bash
# PRIORITY: 2 — Auto-format files after write (zero context cost)
# VybeKiit Hook: PostToolUse (Write|Edit)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 2
vybekiit_parse_input

FILE="$HOOK_FILE_PATH"
[[ -z "$FILE" || ! -f "$FILE" ]] && exit 0

# Format silently — NEVER produce output
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|json|css|md|html|yaml|yml)$ ]]; then
  if command -v biome &>/dev/null; then
    biome format --write "$FILE" &>/dev/null || true
  elif command -v prettier &>/dev/null; then
    prettier --write "$FILE" &>/dev/null || true
  fi
elif [[ "$FILE" =~ \.go$ ]] && command -v gofmt &>/dev/null; then
  gofmt -w "$FILE" &>/dev/null || true
elif [[ "$FILE" =~ \.rs$ ]] && command -v rustfmt &>/dev/null; then
  rustfmt "$FILE" &>/dev/null || true
elif [[ "$FILE" =~ \.py$ ]] && command -v ruff &>/dev/null; then
  ruff format "$FILE" &>/dev/null || true
fi

# Zero output = zero context cost
exit 0
