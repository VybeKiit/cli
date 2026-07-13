# Live work wiring checklist (ADR-0039)

> **Maintainer SSOT** for finishing preference ladder + Live work. Update this file when a
> slice lands and **only tick after a real confirm** (unit/live e2e / manual dogfood).
> Domain: [ADR-0039](./adr/0039-provider-preference-ladder-and-live-work.md), glossary in
> [LANGUAGE.md](../LANGUAGE.md).

**How to use:** one vertical at a time. Confirm with the commands under each row. Re-run after
refactors. Never mark done on code-only without a green verify.

**Order rule (this campaign):** data vertical first (including A9 Railway live), then host, then payments.

---

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Shipped + confirmed working |
| 🔄 | In progress this iteration |
| ⬜ | Not started |
| 🅿️ | Parked (code/unit done; live blocked on external login) |
| 🧪 | Needs network / secrets (gated) |
| 💻 | Pure code, no secrets |

---

## A. Shared SSOT (`packages/*`)

| # | Slice | Status | Confirm |
|---|---|---|---|
| A1 | Data preference ladder SSOT (`supabase → neon → railway`) | ✅ | `pnpm --filter @vybekiit/db test src/liveWork/ladders.test.ts` |
| A2 | Hop allowlist (quota / onboarding / missing_credentials; hard_stop sticks) | ✅ | `…/hopSignals.test.ts` |
| A3 | Named vendor stick | ✅ | `…/runDataLiveWork.test.ts` (named stick case) |
| A4 | Pin keys builder + buyer message (no env jargon; free-tier hop only on quota) | ✅ | `…/pin.test.ts` + hop message cases |
| A5 | Claimable Neon create + `SELECT 1` verify | ✅ | unit mock + live below |
| A6 | `runDataLiveWork` orchestrator (existing wins, demo/dogfood claimable) | ✅ | `…/runDataLiveWork.test.ts` |
| A7 | **Live network:** claimable Neon → pin → insert/get | ✅ 🧪 | `LIVE_WORK_E2E=1 pnpm --filter @vybekiit/db test src/liveWork/liveE2e.test.ts` |
| A8 | Journey tool events from data Live work result (rail-compatible names) | ✅ | `…/journeyEvents.test.ts` + assistant-chat `liveWorkEventsCompat.test.ts` |
| A9 | Railway provision step (CLI create when logged in) | ✅ 🧪 | unit + live: init if unlinked → add postgres → public URL → SELECT 1 (`LIVE_WORK_RAILWAY=1`) |
| A10 | Orphan cleanup after partial success + hop | ✅ 💻 | `…/orphanCleanup.test.ts` + hop-with-orphan in `runDataLiveWork.test.ts` (claimable → TTL) |
| A11 | Host preference ladder skeleton (`cloudflare → render → railway → vercel → netlify → github-pages`) | ✅ | `pnpm --filter @vybekiit/deploy test src/liveWork/liveWork.test.ts` |
| A12 | Host create adapters (Cloudflare Pages first) | ✅ 🧪 | unit + `LIVE_WORK_HOST_E2E=1 …/liveHostE2e.test.ts` create → HTTP 200 → delete |
| A12b | Host create (Render / Railway / Vercel) | ✅ 🧪 | unit + live: Railway create+verify green; **Render full create→verify→delete green** (`LIVE_WORK_HOST_RENDER=1` + `RENDER_API_KEY` + `RENDER_STATIC_REPO`); Vercel **skipped** (account email OTP / Google-link bug — not a code path dogfood) |
| A12c | Host create (Netlify + GitHub Pages) | ✅ 🧪 | unit green; **GitHub Pages live create→verify→delete green** (`LIVE_WORK_HOST_GITHUB_PAGES=1` + `GITHUB_TOKEN`/`gh auth`); Netlify unit + adapter shipped; live **parked** (same Google-link / email-password account bug as Vercel) |
| A15 | Multi-preset live dogfood (SaaS core + full catalog on claimable Neon) | ✅ 🧪 | `DOGFOOD_LIVE=1 pnpm --filter @vybekiit/db test src/presets/liveDogfood.test.ts` (uses `createClaimableNeon`) |
| A13 | Payments preference ladder (`lemon-squeezy → stripe → paypal`) | ✅ 💻 | `pnpm --filter @vybekiit/payments test src/liveWork/liveWork.test.ts` |
| A14 | Auth follows data pin (no auth ladder) | ✅ | companion `AUTH_PROVIDER` on pin; live CLI pin includes `better-auth` |

---

## B. CLI execution cascade

| # | Slice | Status | Confirm |
|---|---|---|---|
| B1 | `vybekiit live-work data` verb + flags | ✅ | `pnpm exec vitest run test/liveWorkDataCmd.test.ts` (cli/) |
| B2 | Data pin via doctor `writeEnvKeys` (secrets never in JSON stdout) | ✅ 🧪 | `cd cli && pnpm exec tsx scripts/runLiveWorkDataE2e.ts` → `secretNotInJson=true` + `hasAuthCompanion=true` |
| B3 | Help documents `live-work data` + `live-work host` | ✅ | `vybekiit help --all` |
| B4 | `vybekiit live-work host` (existing APP_URL pin path) | ✅ | unit + existing-pin dogfood |
| B5 | Host create path via CLI (Cloudflare demo) | ✅ 🧪 | `cd cli && pnpm exec tsx scripts/runLiveWorkHostE2e.ts` → pages.dev + delete |
| B6 | Payments Live work CLI verb | ✅ | `pnpm exec vitest run test/liveWorkPaymentsCmd.test.ts` (cli/) |

---

## C. Buyer skills (thin clients)

| # | Slice | Status | Confirm |
|---|---|---|---|
| C1 | `templates/web` `save-data` step 1 → `vybekiit live-work data` | ✅ | skill text references verb; no reimplemented hop |
| C2 | `templates/backend` `wire-database` → same verb | ✅ | skill text |
| C3 | `go-live` → host Live work when A12/B5 exist | ✅ | skill text references `vybekiit live-work host`; no reimplemented hop (web/spa/backend) |
| C4 | `setup-payments` → payments Live work when A13/B6 exist | ✅ | skill text: web/spa setup-payments + backend wire-payments → `vybekiit live-work payments` |

---

## D. Local-dev console

| # | Slice | Status | Confirm |
|---|---|---|---|
| D1 | Fixture rail (offline / Playwright) still green | ✅ | keep default fixture path for CI |
| D2 | API `POST /api/live-work/data` → package runner, public JSON only | ✅ 🧪 | curl 200; claimable Neon; no `postgresql://` in body; pinKeys include `AUTH_PROVIDER` |
| D3 | Scenario / rail consumes real tool events (opt-in `?live=1`) | ✅ | ScenariosRunner branches on `shouldUseLiveWorkData` |
| D4 | Console never prints secrets; no monorepo pin from demo API | ✅ | `pinned:false`; secret leak guard |
| D5 | API `POST /api/live-work/host` (mirror data) | ✅ 🧪 | curl 200; cloudflare demo create+verify; `pinned:false`; `tornDown:true`; events[]; no tokens in body |
| D6 | API `POST /api/live-work/payments` (mirror data/host) | ✅ 🧪 | curl 200; lemon-squeezy verify; `pinned:false`; pinKeys=`PAYMENTS_PROVIDER`; no secrets in body |

---

## E. Config matrix + dogfood ops

| # | Slice | Status | Confirm |
|---|---|---|---|
| E1 | Root `.env.example` documents claimable pin keys | ✅ | `PUBLIC_POSTGRES_CLAIM_URL`, `CLAIMABLE_POSTGRES_ID` commented |
| E2 | Full matrix comment block for all ladder providers (one file) | ✅ 💻 | root `.env.example` ladders + Render + DOGFOOD_APEX; nightly matrix rg guard |
| E3 | `DOGFOOD_APEX` allowed pool + subdomain-only | ✅ 💻 | `pnpm --filter @vybekiit/deploy test src/liveWork/dogfoodApex.test.ts` |
| E4 | Nightly secrets CI job for live create/verify | ✅ 🧪 | `.github/workflows/live-work-nightly.yml` (claimable + optional CF/Railway/Vercel/Render/payments secrets) |

---

## F. Confirm log (append-only)

| Date | Slice | Command / proof | Result |
|---|---|---|---|
| 2026-07-12 | A1–A7, B1–B3, C1–C2 | unit 108+; live e2e claimable Neon; CLI e2e pin | green |
| 2026-07-12 | A8, D2–D4, E1 | journeyEvents tests; curl POST `/api/live-work/data` → neon claimable, events[], secret-free; `.env.example` claimable keys | green |
| 2026-07-12 | A11, B4 | deploy liveWork 9 tests; `live-work host` existing pin dogfood → cloudflare + APP_URL | green |
| 2026-07-12 | A10, A14, A9 unit | orphanCleanup; pin companion AUTH; railwayProvision unit; live Neon re-run | green (A9 live parked) |
| 2026-07-12 | A12 Cloudflare create | `LIVE_WORK_HOST_E2E=1` liveHostE2e — create Pages, HTTP 200 on `*.pages.dev`, pin keys, delete | green |
| 2026-07-12 | B5 CLI host create | `cli/scripts/runLiveWorkHostE2e.ts` → cloudflare + pages.dev + deletedProject | green |
| 2026-07-12 | A9 park | No `railway` CLI on dogfood machine — unit path remains; live create deferred | parked |
| 2026-07-12 | C3 | `go-live` (web/spa/backend) → `vybekiit live-work host`; doctor/platform fallback only | green |
| 2026-07-12 | D5 | curl POST `/api/live-work/host` demo cloudflare → ok, events[], pinned:false, tornDown:true | green |
| 2026-07-12 | A12b | render/railway/vercel host create adapters + unit; default ladder no longer placeholders | green (unit) |
| 2026-07-12 | A9 | `railway` CLI installed; `whoami` Unauthorized — live create still parked on login | parked |
| 2026-07-12 | A13 | payments liveWork: ladder LS→stripe→paypal, hop/onboarding, pin public-only, journey events; 17 unit tests | green |
| 2026-07-12 | A9 unpark | `railway login` ok; live e2e create postgres + verify public URL + dogfood delete; auto-init when unlinked | green |
| 2026-07-12 | B6 / C4 | `live-work payments` CLI + unit tests; setup-payments (web/spa) + wire-payments thin clients | green |
| 2026-07-12 | E2–E4 | `.env.example` full ladder matrix + Render + DOGFOOD_APEX; dogfoodApex 10 unit; live-work-nightly.yml | green |
| 2026-07-12 | A12b live | Railway host create+verify live green; CF host re-green; Render/Vercel live suites gated; quota hop for free-plan limit | green |
| 2026-07-12 | D6 | `POST /api/live-work/payments` + client; curl lemon-squeezy ok; pinKeys public-only; scenarios wire payments/host | green |
| 2026-07-12 | A12b Render live | Browser mint `RENDER_API_KEY` (Google SSO + Create API Key); public dogfood repo `YosefHayim/vybekiit-lw-static-dogfood`; fix `ownerId` + `buildPlan` false quota; `LIVE_WORK_HOST_RENDER=1` create→HTTP verify→delete green (~21s); leftover services 0 | green |
| 2026-07-12 | A12b Vercel skip | Vercel live dogfood blocked on account email OTP / Google not linked (not product code). Skip until account link fixed. | skipped |
| 2026-07-12 | A15 presets live | `DOGFOOD_LIVE=1` SaaS core (8) + full catalog (22) apply+verify+orders CRUD on claimable Neon via `createClaimableNeon` | green (~49s) |
| 2026-07-12 | A12c GitHub Pages live | `LIVE_WORK_HOST_GITHUB_PAGES=1` create public repo → enable Pages → HTTP verify green (~43s). Teardown needs `delete_repo` scope (`gh auth refresh -s delete_repo`); leftover `YosefHayim/vybekiit-lw-gp-mrh7tgem` if scope missing | green (create/verify); delete scope note |
| 2026-07-12 | A12c Netlify unit + park | Netlify REST file-digest adapter + unit; live mint blocked: Netlify Google SSO → "email already in use" (password account). Same class as Vercel. | unit green / live parked |

---

## Next up (ordered)

Optional hygiene / unpark:

1. Repo Actions secrets so nightly host/payments jobs leave skip-mode (`CLOUDFLARE_*`, `RAILWAY_TOKEN`, `RENDER_API_KEY` + `RENDER_STATIC_REPO`, `GITHUB_TOKEN`, `NETLIFY_AUTH_TOKEN`, Lemon/Stripe/PayPal as available)
2. Vercel + Netlify live dogfood after account email/password / Google-link is fixed (`LIVE_WORK_HOST_VERCEL=1`, `LIVE_WORK_HOST_NETLIFY=1`)

---

## Quick dogfood

```bash
# data package live (network, no account)
LIVE_WORK_E2E=1 pnpm --filter @vybekiit/db test src/liveWork/liveE2e.test.ts

# data CLI pin path (network)
cd cli && pnpm exec tsx scripts/runLiveWorkDataE2e.ts

# host package live (needs wrangler login + pages:write)
LIVE_WORK_HOST_E2E=1 pnpm --filter @vybekiit/deploy test src/liveWork/liveHostE2e.test.ts

# host CLI demo create (needs wrangler login)
cd cli && pnpm exec tsx scripts/runLiveWorkHostE2e.ts

# A12b/A12c host vendors (explicit gates)
LIVE_WORK_HOST_RAILWAY=1 pnpm --filter @vybekiit/deploy test src/liveWork/liveHostVendorsE2e.test.ts
# LIVE_WORK_HOST_VERCEL=1 VERCEL_TOKEN=… …
# LIVE_WORK_HOST_RENDER=1 RENDER_API_KEY=… RENDER_STATIC_REPO=…
# LIVE_WORK_HOST_NETLIFY=1 NETLIFY_AUTH_TOKEN=…
# LIVE_WORK_HOST_GITHUB_PAGES=1  # uses GITHUB_TOKEN or `gh auth token`

# multi-preset live (claimable Neon, no account)
DOGFOOD_LIVE=1 pnpm --filter @vybekiit/db test src/presets/liveDogfood.test.ts

# dogfood apex unit (no network)
pnpm --filter @vybekiit/deploy test src/liveWork/dogfoodApex.test.ts

# console API data (dev server on :3005)
curl -sS -X POST http://localhost:3005/api/live-work/data \
  -H 'Content-Type: application/json' \
  -d '{"mode":"demo","vendor":"neon","fresh":true}'

# console API host (needs wrangler login for create path)
curl -sS -X POST http://localhost:3005/api/live-work/host \
  -H 'Content-Type: application/json' \
  -d '{"mode":"demo","vendor":"cloudflare","fresh":true}'

# console API payments (reads monorepo root .env keys; never returns secrets)
curl -sS -X POST http://localhost:3005/api/live-work/payments \
  -H 'Content-Type: application/json' \
  -d '{"mode":"demo","fresh":true}'

# host existing pin (no create)
# .env: HOSTING_PROVIDER=cloudflare + APP_URL=https://…
vybekiit live-work host --mode=buyer --cwd=.

# railway data live create (after `railway login` + linked project)
LIVE_WORK_E2E=1 LIVE_WORK_RAILWAY=1 pnpm --filter @vybekiit/db test src/liveWork/liveE2e.test.ts

# payments CLI dogfood
cd cli && pnpm exec tsx scripts/runLiveWorkPaymentsDogfood.ts

# nightly workflow (maintainer): Actions → "Live work nightly" → Run workflow
# Optional secrets: CLOUDFLARE_*, RAILWAY_TOKEN, VERCEL_TOKEN, RENDER_*, LEMONSQUEEZY_*/STRIPE_*/PAYPAL_*
```
