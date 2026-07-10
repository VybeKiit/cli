# Landing go-live checklist

Maintainer runbook for making `apps/landing` (vybekiit.com) ready for real visitors.
Track gates here; paste secrets only into env / Cloudflare Worker secrets — never into this file.

## Progress

- [ ] Payments + webhook + GitHub gate verified end-to-end
- [ ] Homepage matches the approved light visitor mock
- [ ] Google Tag configured and firing
- [ ] Sentry receiving a test error
- [ ] PostHog recording a pageview
- [ ] Live smoke checks on production

---

## 1. Before visitors

- [ ] Lemon Squeezy (or active `PAYMENTS_PROVIDER`) keys are set for the store
- [ ] `STORE_PRODUCT_ID` points at the real product
- [ ] Webhook route receives test events and invites/removes via the gate
- [ ] Custom domain `vybekiit.com` / `www` resolves on the Worker (ADR-0028)
- [ ] `pnpm --filter vybekiit-landing test` and `typecheck` and `build` pass
- [ ] `pnpm --filter vybekiit-landing cf:deploy` succeeds when you intend to ship

Deploy reminder: from `apps/landing`, `pnpm cf:deploy` (OpenNext on Cloudflare Workers).

---

## 2. Google Tag (GTM or GA4)

The landing injects tags from public env vars (safe in the browser bundle).

### Preferred: Google Tag Manager

1. Create a GTM container for `vybekiit.com` (Web).
2. Copy the container id (`GTM-XXXXXXX`).
3. Set in monorepo env / Worker secrets:
   - `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`
4. Redeploy the landing so the public env is baked into the client bundle.
5. In GTM, add tags you need (GA4 Configuration, conversion pixels, etc.).
6. **Verify:** open the live site with [Tag Assistant](https://tagassistant.google.com/) — container loads, no console errors.

### Alternative: GA4 only (no GTM)

If you are not using GTM yet:

1. Create a GA4 property + Web data stream for `vybekiit.com`.
2. Copy the Measurement ID (`G-XXXXXXXX`).
3. Set:
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX`
4. Leave `NEXT_PUBLIC_GTM_ID` empty (GTM takes precedence when both are set).
5. **Verify:** GA4 Realtime shows your visit after loading the homepage.

Code entry: `apps/landing/src/components/VisitorScripts.tsx`.

---

## 3. Sentry (error alerts + tracing + session replay)

Uses `@sentry/nextjs` on the store only (`apps/landing`). Default is a silent no-op until a DSN is set.

1. Sentry SaaS project is **`individual-kl` / `vybekiit`** (Next.js).
2. Put the project DSN in monorepo `.env` (and Worker / build env for production):
   - `SENTRY_DSN=<dsn>` — server + edge
   - `NEXT_PUBLIC_SENTRY_DSN=<dsn>` — browser (same DSN is fine)
   - `SENTRY_ORG=individual-kl`
   - `SENTRY_PROJECT=vybekiit`
   - Optional source maps: `SENTRY_AUTH_TOKEN=<token>` (secret — never commit)
3. Redeploy so client + server runtimes pick up the keys (`NEXT_PUBLIC_*` is build-time).
4. Trigger a test error: open `/sentry-example-page` and click **Throw sample error**.
5. **Verify:** the event appears in [Sentry Issues](https://sentry.io/issues/) within about a minute.
   Also check **Replays** (error sessions) and **Traces** after navigating.
6. Delete `app/sentry-example-page/` after verifying.

Code entry:

- `instrumentation-client.ts` — browser init + Session Replay + router transitions
- `sentry.server.config.ts` / `sentry.edge.config.ts` — Node + Edge init
- `instrumentation.ts` — registers server/edge configs + `onRequestError`
- `app/global-error.tsx` — root React error boundary → Sentry
- `next.config.mjs` — `withSentryConfig` (source maps + `/monitoring` tunnel)
- `src/lib/observability.ts` — manual `captureException` / `captureMessage`

Cloudflare note: `wrangler.jsonc` already has `nodejs_compat` and a
`compatibility_date` ≥ 2025-08-16 (required by Sentry on Workers).

Turn off after the test: remove the deliberate throw; keep the DSNs for production.

---

## 4. PostHog (visitor stats / product analytics)

Uses the official **posthog-js** Web SDK on the store only (`apps/landing`),
initialized in `instrumentation-client.ts` (Next.js client instrumentation).

1. Create a PostHog project (Cloud US or EU).
2. Copy the **project token** (`phc_…`) from project settings.
3. Set in monorepo `.env` (and Worker / host env for production):
   - `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_…`
   - `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` (or `https://eu.i.posthog.com`)
4. Keep `ANALYTICS_PROVIDER=local` (or unset) so the legacy
   `@vybekiit/analytics` PostHog snippet does not double-count.
5. Redeploy / restart dev so the public env is embedded in the client bundle.
6. Load the homepage once in a normal browser (ad blockers may block PostHog).
7. **Verify:** PostHog Live events / `$pageview` for the session.

Code entry:

- `instrumentation-client.ts` — `posthog.init(…, { api_host, defaults: '2026-05-30' })`
- `src/lib/analyticsEvents.ts` — event name SSOT
- `src/lib/analyticsClient.ts` / `analyticsServer.ts` — capture helpers
- Manual capture: `import { trackClient } from '@/lib/analyticsClient'`

### Funnel events (store)

| Event | When |
|---|---|
| `cta_clicked` | Hero / header / pricing / cancel retry toward checkout or compare |
| `nav_clicked` | Header section links |
| `checkout_page_viewed` | `/checkout` opened |
| `checkout_form_started` | First field focus |
| `checkout_validation_failed` | Invalid submit |
| `checkout_submitted` | Valid form submit (identifies by email) |
| `checkout_session_created` | Hosted payment URL ready (client + server) |
| `checkout_session_failed` | Checkout API error |
| `purchase_completed` | `/success` after payment |
| `checkout_canceled` | `/cancel` after abandon |
| `order_fulfilled` / `order_refunded` | Payment webhook + gate |
| `faq_opened` | FAQ accordion opened |
| `support_clicked` | Success-page support links |

Local default without a project token: PostHog stays disabled.

---

## 5. Live smoke checks

On `https://vybekiit.com` after deploy:

- [ ] Homepage renders light visitor layout (hero, operator steps, compare, pricing, FAQ)
- [ ] Primary CTA reaches `/checkout`
- [ ] Legal links `/terms` and `/privacy` work
- [ ] Tag Assistant / GA Realtime shows traffic (if Google Tag enabled)
- [ ] PostHog shows a pageview (if enabled)
- [ ] Sentry accepts a test error (if enabled)
- [ ] Test checkout still creates a session (practice mode first)

---

## Env key reference (names only)

| Concern | Keys |
|---|---|
| Google Tag Manager | `NEXT_PUBLIC_GTM_ID` |
| Google Analytics (no GTM) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| PostHog | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` (keep `ANALYTICS_PROVIDER=local`) |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`; optional `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` |
| Payments (existing) | provider keys + `STORE_PRODUCT_ID` + webhook secret |

Public keys use the `NEXT_PUBLIC_` prefix so Next can embed them for the browser. Server-only secrets must never use that prefix.

---

## Decision log

<!-- Append dated entries; never delete -->
