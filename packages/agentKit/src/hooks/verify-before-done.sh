#!/usr/bin/env bash
# PRIORITY: 1 — Verify build/tests pass before marking done
# VybeKiit Hook: Stop
set -uo pipefail
source "$(dirname "$0")/_runner.sh"
vybekiit_gate 1

# Stop hooks don't get tool_input — just run verification
WARNINGS=""

# TypeScript check
if [ -f "tsconfig.json" ]; then
  if ! npx tsc --noEmit 2>/dev/null; then
    WARNINGS="${WARNINGS}tsc errors. "
  fi
fi

# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then PM="pnpm"
elif [ -f "bun.lockb" ]; then PM="bun"
elif [ -f "yarn.lock" ]; then PM="yarn"
else PM="npm"; fi

# Build check
if [ -f "package.json" ] && grep -q '"build"' package.json 2>/dev/null; then
  if ! $PM run build 2>/dev/null; then
    WARNINGS="${WARNINGS}Build failing. "
  fi
fi

# Test check (only if test script exists and isn't the default)
if [ -f "package.json" ] && grep -q '"test"' package.json 2>/dev/null; then
  if ! grep -q '"test".*"echo' package.json 2>/dev/null; then
    if ! $PM test 2>/dev/null; then
      WARNINGS="${WARNINGS}Tests failing. "
    fi
  fi
fi

if [ -n "$WARNINGS" ]; then
  vybekiit_stop_continue "⚠️ ${WARNINGS}Fix before completing."
fi

exit 0
