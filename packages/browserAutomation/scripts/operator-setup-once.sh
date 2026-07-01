#!/usr/bin/env bash
# One-shot LS operator run — sign in to Lemon Squeezy in Chrome first, then:
#   bash packages/browser-automation/scripts/operator-setup-once.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BA="$ROOT/packages/browser-automation"
LANDING="$ROOT/apps/landing"
WEBHOOK_URL="${LS_WEBHOOK_URL:-https://cubical-trident-anthology.ngrok-free.dev/api/webhook}"
IMAGE="$ROOT/apps/landing/app/icon.svg"
LS_PROFILE="${LS_PROFILE:-${AUTOMATE_PROFILE_LS:-$HOME/.ls-chrome-profile}}"

cd "$BA"
pnpm build >/dev/null

node scripts/ensure-chrome-cdp.mjs 9222 "$LS_PROFILE"

echo "Running ls setup — sign in when prompted; automation continues on redirect…"
node dist/cli/index.cjs ls setup --json \
  --name='VybeKiit' \
  --description='Become a software builder without becoming a software engineer.' \
  --price-cents=2900 \
  --mode=test \
  --webhook-url="$WEBHOOK_URL" \
  --hide-from-storefront \
  --license-keys \
  --image-path="$IMAGE" \
  | tee /tmp/ls-setup-output.json \
  | node scripts/write-landing-env.mjs

echo "Restart landing dev server to pick up .env.local changes."
echo "Smoke test:"
echo "  curl -s localhost:3000/api/checkout -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"githubUsername\":\"testuser\"}'"
