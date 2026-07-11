# apps/landing — the VybeKiit store

Our own marketing + checkout site, and a **workspace member in the CI gate** (`next build` +
`tsc` + tests run on every change). It is **dogfooded from `templates/web`** — the same stack we
sell (Next.js + shadcn-over-Tailwind, shared `@vybekiit/tokens`, RTL-safe layout) — so the landing
page is itself proof the kit works.

## What's here

- **Marketing home** (`app/page.tsx`) — light visitor storefront (hero, operator steps, problem /
  solution, three platforms, compare, pricing, FAQ). Copy/data lives in `src/data/*` (see
  `visitorLanding.ts` + `site.ts`); components only render. The `$29` is the single `PRICE`
  constant in `src/data/site.ts`.
- **Checkout** (`app/checkout` + `app/api/checkout/route.ts`) — collects the buyer's GitHub
  username + email, validates both, and creates a hosted checkout via the provider-agnostic
  `@vybekiit/payments`. What's sold comes from `STORE_PRODUCT_ID` (see root `.env.example`).
  `app/success` and `app/cancel` are the post-checkout states.
- **The gate** — the only store-specific logic over the template:
  - `src/lib/gate.ts` — invite/remove a buyer on the private repo via the GitHub API.
  - `app/api/webhook/route.ts` — payment webhook → the gate (paid → invite, refund → remove).
- **Visitor instrumentation** (env-gated, no-op without keys):
  - Google Tag → `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - PostHog (`posthog-js`) → `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` + `NEXT_PUBLIC_POSTHOG_HOST`
  - Sentry (`@sentry/nextjs`) → `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (optional
    `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` for source maps)

This is the v1.0 keystone: *a stranger pays → gets invited → scaffolds a web app → wires payments
→ deploys live* (see `CONTEXT.md` → Build order).

## Brand marks CDN (R2)

Logo WebPs under `public/brand-marks/` (+ `brand-marks-3d/`, `vybekiit-*.svg`) ship from a public
Cloudflare R2 bucket so marquees don't bloat the Worker assets bundle:

- Bucket: `vybekiit-landing-assets`
- Public base: `https://pub-e43389539f974d69b9ec3c1fb0f08dd6.r2.dev`
- Cache: `Cache-Control: public, max-age=86400, stale-while-revalidate=86400` (1 day)
- URL helper: `src/lib/cdnAssets.ts` (`cdnAssetUrl`) — override with `NEXT_PUBLIC_ASSETS_BASE_URL`
- Re-upload after changing marks: `pnpm --filter vybekiit-landing upload-assets:r2`
  (uses wrangler OAuth; run `npx wrangler login` if needed)

Local `public/` files stay as the authoring source; the runtime prefers the R2 URLs.

## Go live

Follow the maintainer checklist: **[docs/checklist.md](./docs/checklist.md)** (Google Tag, Sentry,
PostHog, payments, smoke checks). Deploy: `pnpm --filter vybekiit-landing cf:deploy` (OpenNext on
Cloudflare Workers — ADR-0028).

## Still to wire (issue #4 — live)

Real checkout + the gate need the store's live Lemon Squeezy keys and `STORE_PRODUCT_ID`.
Default invite bundle is `kit` + `web` + `mobile` + `extension` (`GITHUB_GATE_REPOS`) so
`create app` can clone the gated kit workspace (ADR-0038). Tracked under issue #4.
