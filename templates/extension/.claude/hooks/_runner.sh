#!/usr/bin/env bash
# _runner.sh — Shared hook gate for VybeKiit
# Every hook sources this first. It handles:
#   1. Priority gating (skip hooks below project threshold)
#   2. Silent pass-through (exit 0 = zero context cost)
#   3. Output budgeting (truncates long messages)
#   4. Per-hook disable via config
#
# Usage in hook scripts:
#   source "$(dirname "$0")/_runner.sh"
#   vybekiit_gate 5  # This hook's priority
#   # ... rest of hook logic only runs if gate passes
#
# Config: .vybekiit/hook-config.json (optional, project root)
# ───────────────────────────────────────────────────────────

# ─── Priority Level Resolution ─────────────────────────────
# Order: env var → config file → default (standard = P1-P7)
_VYBEKIIT_CONFIG=".vybekiit/hook-config.json"
_VYBEKIIT_LEVEL="${VYBEKIIT_HOOK_LEVEL:-}"

if [ -z "$_VYBEKIIT_LEVEL" ] && [ -f "$_VYBEKIIT_CONFIG" ]; then
  _VYBEKIIT_LEVEL=$(jq -r '.level // empty' "$_VYBEKIIT_CONFIG" 2>/dev/null || echo "")
fi

# Default: standard (P1-P7)
_VYBEKIIT_LEVEL="${_VYBEKIIT_LEVEL:-standard}"

# Map level name to max priority number
case "$_VYBEKIIT_LEVEL" in
  minimal)  _MAX_PRIORITY=2 ;;
  strict)   _MAX_PRIORITY=5 ;;
  standard) _MAX_PRIORITY=7 ;;
  relaxed)  _MAX_PRIORITY=9 ;;
  all)      _MAX_PRIORITY=10 ;;
  *)        _MAX_PRIORITY=7 ;;
esac

# ─── Hook Disable Check ───────────────────────────────────
_is_hook_disabled() {
  local hook_name="$1"
  if [ ! -f "$_VYBEKIIT_CONFIG" ]; then return 1; fi
  local disabled
  disabled=$(jq -r ".disabled[]? // empty" "$_VYBEKIIT_CONFIG" 2>/dev/null | grep -x "$hook_name" || echo "")
  [ -n "$disabled" ]
}

# ─── Gate Function ────────────────────────────────────────
# Call this at the top of every hook. If the hook shouldn't run,
# it exits immediately with 0 (silent, zero context cost).
vybekiit_gate() {
  local priority="${1:-5}"
  local hook_name
  hook_name=$(basename "${BASH_SOURCE[1]}" .sh 2>/dev/null || echo "unknown")
  
  # Priority gate
  if [ "$priority" -gt "$_MAX_PRIORITY" ]; then
    exit 0
  fi
  
  # Per-hook disable
  if _is_hook_disabled "$hook_name"; then
    exit 0
  fi
}

# ─── Output Budget ────────────────────────────────────────
# Wraps the block/warn output to keep it tight.
# Max: 200 chars for reason, single-line preferred.
vybekiit_block() {
  local reason="$1"
  # Truncate to 200 chars
  if [ ${#reason} -gt 200 ]; then
    reason="${reason:0:197}..."
  fi
  echo "{\"decision\":\"block\",\"reason\":\"$reason\"}"
  exit 0
}

vybekiit_warn() {
  local reason="$1"
  if [ ${#reason} -gt 150 ]; then
    reason="${reason:0:147}..."
  fi
  # Warnings use continue (Stop hooks) or just echo (PostToolUse)
  echo "$reason"
  exit 0
}

vybekiit_stop_continue() {
  local reason="$1"
  if [ ${#reason} -gt 150 ]; then
    reason="${reason:0:147}..."
  fi
  echo "{\"continue\":true,\"reason\":\"$reason\"}"
  exit 0
}

# ─── Input Parser ─────────────────────────────────────────
# Parses the JSON stdin once, exports common fields.
vybekiit_parse_input() {
  _HOOK_INPUT=$(cat)
  HOOK_FILE_PATH=$(echo "$_HOOK_INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || echo "")
  HOOK_COMMAND=$(echo "$_HOOK_INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
  HOOK_CONTENT=$(echo "$_HOOK_INPUT" | jq -r '.tool_input.content // empty' 2>/dev/null || echo "")
  export HOOK_FILE_PATH HOOK_COMMAND HOOK_CONTENT _HOOK_INPUT
}
