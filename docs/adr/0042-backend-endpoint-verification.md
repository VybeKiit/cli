# ADR-0042: Backend endpoint verification — local contract in the required gate, real matrix nightly

## Status

Accepted — 2026-07-12

## Context

`templates/backend` exposes 12 `/api/auth/*` routes plus `/health` and the payments webhook, but they
are effectively unverified: `test/app.test.ts` only asserts `createApp()` is defined, and
`e2e/smoke.spec.ts` is a Playwright `GET /health`. Nothing drives the auth routes, the
session-cookie / `Authorization: Bearer` guard, or the `helmet → cors → cookie-parser` chain. We want
to reliably say the backend is valid and ready for its mobile/extension/SPA clients.

"Reliable" must cover the provider swap (ADR-0002 / ADR-0018): the same HTTP contract has to hold
whichever adapter `AUTH_PROVIDER` / `DATA_PROVIDER` resolves. Several forces make a real-provider
matrix a poor fit for the **required** gate:

- Real providers are network/rate-limit flaky and need secrets. The repo already isolates them in a
  secret-gated nightly lane (`live-work-nightly.yml`; `packages/db/src/liveWork/liveE2e.test.ts` uses
  `describe.runIf(LIVE)`; ADR-0039) and keeps template e2e opt-in (`PLAYWRIGHT_ENABLED`).
- GitHub Actions withholds secrets from fork PRs, so "real on every PR" silently degrades to local
  for external contributors anyway.
- ~8 of the 12 auth routes deliver their code **out-of-band** (email-OTP, magic-link, password-reset,
  SMS-OTP); they cannot be asserted without a provider admin/test API or a live inbox/SMS. Real SMS
  means Twilio spend. `better-auth` currently declares `passwordReset: false` / `magicLink: false`
  (`packages/auth/src/providers/betterAuth/index.ts`), deferring email delivery to the buyer's
  `add-signin` skill.
- A flaky required gate destroys the signal it exists to give.

Social OAuth ("Sign in with Google") is **not** an Express-backend concern: it runs on the
web/mobile/extension templates via the provider (ADR-0024, Supabase GoTrue); the `sign-in-with-google`
skill exists only for those templates, never for `backend`. The backend's verifiable auth surface is
password + email-OTP + magic-link + password-reset + SMS-OTP plus the session/bearer guard.

## Decision

1. **Keep the eager, synchronous adapter registry (ADR-0018).** Do not refactor to lazy dynamic
   `import()`. Verification *proves* the swap; it does not change how dispatch works.
2. **Required PR gate — dep-free loopback contract.** A Vitest suite boots the real app on an
   ephemeral port (`app.listen(0)`) and drives every generated route with Node's built-in `fetch`, so
   `helmet`/`cors`/`cookie-parser` and the router run over a real socket. It runs on the **local dev
   adapter** (ADR-0008; deterministic `DEV_USER` + `local-dev-session`) and asserts each route's
   contract, the cookie + `Authorization: Bearer` guard, and the `/health` + webhook paths. No new
   dependency (respects ADR-0034).
3. **Prove the swap on every PR without network.** Per-adapter logic tests for Supabase / Cognito /
   better-auth via the injection seams the code already exposes (`ResolveAuthInjections`,
   `BetterAuthProviderOptions.instance` — "so unit tests never open a database connection"), plus
   selection-correctness assertions for every provider key (extend `packages/auth/src/resolve.test.ts`).
4. **Real cross-provider matrix runs nightly.** Real Supabase + better-auth on claimable Neon (reuse
   `liveWork`) + Cognito run in the existing live lane (`live-work-nightly.yml`, `describe.runIf`),
   secret-gated + `workflow_dispatch`, out-of-band codes read via each provider's admin/test API and
   SMS via Twilio test credentials. Skips gracefully where a vendor secret is absent.
5. **The contract suite decodes responses against the registry response Schemas (ADR-0043)**, so it
   doubles as proof the OpenAPI document and typed client match the running server.

## Consequences

- A green required gate means every generated endpoint, the guard, and the provider swap are proven
  deterministically, with no secrets — the trustworthy "ready for use" signal.
- Real-provider drift is caught within a day (nightly) or on demand, not on PRs; the required gate
  stays fast and non-flaky.
- Social OAuth verification stays on the client-template track (ADR-0024), separate from this gate.
- New backend surface: a small loopback test helper; `pnpm --filter my-vybekiit-backend test` becomes
  meaningful and is wired into the always-on gate (`ci.yml` / `test.yml`).
