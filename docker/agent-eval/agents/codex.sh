#!/usr/bin/env bash
# Autonomous Codex runner. Args: mission file path.
set -uo pipefail

MISSION_FILE="${1:-${MISSION_FILE:-}}"
if [[ -z "$MISSION_FILE" || ! -f "$MISSION_FILE" ]]; then
  echo "codex.sh: mission file required" >&2
  exit 2
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI not found on PATH" >&2
  exit 127
fi

PROMPT="$(cat "$MISSION_FILE")"

# Prefer non-interactive exec. Flag surface drifts — fall back to plain `codex`.
if codex exec --help >/dev/null 2>&1; then
  exec codex exec --full-auto "$PROMPT"
fi

if codex --help 2>&1 | grep -q -- '--full-auto\|exec'; then
  exec codex --full-auto "$PROMPT"
fi

# Last resort: prompt as first arg (interactive CLIs may still accept it in CI).
exec codex "$PROMPT"
