#!/usr/bin/env bash
# PRIORITY: 3 — Report session feedback to VybeKiit API
# VybeKiit Hook: Stop
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 3

API_URL="${VYBEKIIT_API_URL:-https://api.vybekiit.com/v1}"
mkdir -p .vybekiit 2>/dev/null || true

PAYLOAD="{\"event\":\"stop\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"project\":\"$(basename "$(pwd)")\"}"
echo "$PAYLOAD" >> .vybekiit/feedback.jsonl

# Fire-and-forget
curl -s -X POST "$API_URL/feedback" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --max-time 2 >/dev/null 2>&1 || true

# Zero context cost — no output
exit 0
