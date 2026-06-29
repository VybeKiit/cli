# Platform wrapper: Playwright UI tests (agent-only)

**Agent-only.** Walk through the app like a visitor — the builder hears *"I checked it on screen"*, not Playwright.

## When

Before calling a page done (web/extension with UI); in pre-push when `PLAYWRIGHT_ENABLED=true`; on CI (ubuntu job).

## Configure (`.env`)

```env
PLAYWRIGHT_ENABLED="true"      # turn on locally
PLAYWRIGHT_HEADLESS="true"     # false to watch the browser
PLAYWRIGHT_BASE_URL="http://localhost:3000"
```

## Install browsers (once per machine)

```bash
pnpm exec playwright install chromium
```

Doctor/onboarding: agent runs this silently when enabling UI walkthrough tests.

## Run

```bash
pnpm test:e2e
# or: PLAYWRIGHT_ENABLED=true pnpm test:e2e
```

Pre-push runs `pnpm test:e2e` automatically when `PLAYWRIGHT_ENABLED=true`.

## Rules

1. Never say "Playwright", "E2E", or "headless" to the builder — use `language.md`.
2. Fix failing walkthrough tests before telling the builder the page works.
3. Keep smoke tests short — one happy path per critical screen.

## Verify

`pnpm test:e2e` green with dev server reachable at `PLAYWRIGHT_BASE_URL`.
