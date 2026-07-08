#!/usr/bin/env bash
# PRIORITY: 2 — Warn on suspicious package installs
# VybeKiit Hook: PreToolUse (Bash)
set -euo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 2
vybekiit_parse_input

[[ -z "$HOOK_COMMAND" ]] && exit 0

# Only check install commands
if ! echo "$HOOK_COMMAND" | grep -qE '(npm|pnpm|yarn|bun)\s+(install|add|i)\s'; then
  exit 0
fi

# Extract packages (skip flags)
PKGS=$(echo "$HOOK_COMMAND" | sed 's/.*\(install\|add\|i\)\s*//' | tr ' ' '\n' | grep -v '^-' | grep -v '^$')

# Safe scopes
SAFE_SCOPES="@vybekiit|@effect|@types|@tanstack|@radix-ui|@shadcn|@tailwindcss|@t3-oss|@trpc|@clerk|@supabase|@sentry|@stripe|@vercel|@cloudflare|@expo|@react-native|@prisma|@biomejs|@playwright|@vitejs|@hono|@testing-library|@auth|@modelcontextprotocol"

while IFS= read -r pkg; do
  [[ -z "$pkg" ]] && continue
  # Safe if scoped to known org
  if echo "$pkg" | grep -qE "^($SAFE_SCOPES)/"; then continue; fi
  # Suspicious: very short name, contains typo patterns
  if [[ ${#pkg} -le 2 ]] || echo "$pkg" | grep -qE '^[0-9]|--'; then
    vybekiit_block "Suspicious package '${pkg}' — verify at npmjs.com before installing."
  fi
done <<< "$PKGS"

exit 0
