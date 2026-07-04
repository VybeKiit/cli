#!/bin/sh
set -eu

cd /workspace

echo "[dev-verify] Building component library index + Next app…"
pnpm --filter vybekiit-component-library build

echo "[dev-verify] Starting UI library on :3002…"
pnpm --filter vybekiit-component-library start &
SERVER_PID=$!

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:3002/ >/dev/null 2>&1; then
    echo "[dev-verify] UI library responded on attempt ${attempt}."
    break
  fi
  if [ "$attempt" -eq 10 ]; then
    echo "[dev-verify] UI library failed to respond on :3002" >&2
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 2
done

echo "[dev-verify] Native toolchain planner checks passed during image build."
echo "[dev-verify] Container ready — UI library at http://localhost:3002"

wait "$SERVER_PID"
