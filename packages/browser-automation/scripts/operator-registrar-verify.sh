#!/usr/bin/env bash
# One-shot parallel registrar setup — sign in when prompted; automation continues on redirect.
#   bash packages/browser-automation/scripts/operator-registrar-verify.sh
#
# Profile overrides (never deletes profile directories — only starts or attaches Chrome):
#   NC_PROFILE / GD_PROFILE — explicit user-data-dir paths
#   AUTOMATE_PROFILE_NC / AUTOMATE_PROFILE_GD — same via env
#   --profile=last on CLI — reuse last path from ~/.vybekiit/automate-profiles.json
#
# Optional: FORCE_RELAUNCH=1 stops Chrome on the CDP port before starting (does NOT rm profiles).
set -euo pipefail

BA="$(cd "$(dirname "$0")/.." && pwd)"
NC_CDP_PORT="${NC_CDP_PORT:-9223}"
GD_CDP_PORT="${GD_CDP_PORT:-9224}"
NC_CDP="http://127.0.0.1:${NC_CDP_PORT}"
GD_CDP="http://127.0.0.1:${GD_CDP_PORT}"
NC_PROFILE="${NC_PROFILE:-${AUTOMATE_PROFILE_NC:-$HOME/.nc-chrome-profile}}"
GD_PROFILE="${GD_PROFILE:-${AUTOMATE_PROFILE_GD:-$HOME/.gd-chrome-profile}}"

cd "$BA"
pnpm build >/dev/null

echo "Ensuring dedicated Chrome instances (Playwright connectOverCDP does not pick a profile — Chrome must be launched with --user-data-dir):"
node scripts/ensure-chrome-cdp.mjs "$NC_CDP_PORT" "$NC_PROFILE"
node scripts/ensure-chrome-cdp.mjs "$GD_CDP_PORT" "$GD_PROFILE"

echo ""
echo "=== Registrar setup (parallel) ==="
echo "Sign in in the DEDICATED Chrome windows below — not your regular Chrome."
echo "  Namecheap → ${NC_CDP}  profile: ${NC_PROFILE}"
echo "  GoDaddy   → ${GD_CDP}  profile: ${GD_PROFILE}"
echo ""

NC_LOG="/tmp/nc-setup.json"
GD_LOG="/tmp/gd-setup.json"

node dist/cli/index.cjs nc setup --json --cdp="${NC_CDP}" --profile="${NC_PROFILE}" | tee "$NC_LOG" &
NC_PID=$!
node dist/cli/index.cjs gd setup --json --cdp="${GD_CDP}" --profile="${GD_PROFILE}" --name='VybeKiit' | tee "$GD_LOG" &
GD_PID=$!

NC_EXIT=0
GD_EXIT=0
wait "$NC_PID" || NC_EXIT=$?
wait "$GD_PID" || GD_EXIT=$?

echo ""
echo "Results:"
echo "  nc exit=${NC_EXIT} log=${NC_LOG}"
echo "  gd exit=${GD_EXIT} log=${GD_LOG}"

if [[ "$NC_EXIT" -ne 0 || "$GD_EXIT" -ne 0 ]]; then
  exit 1
fi
