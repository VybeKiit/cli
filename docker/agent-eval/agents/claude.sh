#!/usr/bin/env bash
# Autonomous Claude Code runner. Args: mission file path.
set -uo pipefail

MISSION_FILE="${1:-${MISSION_FILE:-}}"
if [[ -z "$MISSION_FILE" || ! -f "$MISSION_FILE" ]]; then
  echo "claude.sh: mission file required" >&2
  exit 2
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH" >&2
  exit 127
fi

PROMPT="$(cat "$MISSION_FILE")"

# Headless / print mode with workspace trust for dogfood.
# Re-check flags when upgrading @anthropic-ai/claude-code.
exec claude \
  -p "$PROMPT" \
  --dangerously-skip-permissions \
  --output-format text
