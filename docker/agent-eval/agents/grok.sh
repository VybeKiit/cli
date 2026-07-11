#!/usr/bin/env bash
# Autonomous Grok CLI runner. Args: mission file path.
set -uo pipefail

MISSION_FILE="${1:-${MISSION_FILE:-}}"
if [[ -z "$MISSION_FILE" || ! -f "$MISSION_FILE" ]]; then
  echo "grok.sh: mission file required" >&2
  exit 2
fi

PROMPT="$(cat "$MISSION_FILE")"

# Registry candidates: grok, agent
BIN=""
for candidate in grok agent; do
  if command -v "$candidate" >/dev/null 2>&1; then
    BIN="$candidate"
    break
  fi
done

if [[ -z "$BIN" ]]; then
  echo "grok/agent CLI not found on PATH" >&2
  exit 127
fi

# Prefer non-interactive / print-style flags when available.
if "$BIN" --help 2>&1 | grep -qE -- '--prompt|-p |print'; then
  if "$BIN" -p "$PROMPT" 2>/dev/null; then
    exit $?
  fi
  if "$BIN" --prompt "$PROMPT" 2>/dev/null; then
    exit $?
  fi
fi

exec "$BIN" "$PROMPT"
