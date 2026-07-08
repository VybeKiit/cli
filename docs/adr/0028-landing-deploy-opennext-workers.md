# ADR-0028: Landing deploys via OpenNext on Cloudflare Workers

## Status

Accepted — 2026-07-03

## Context

`apps/landing` (the store, `vybekiit.com`) is a Next.js 15 app with SSR routes
(`/api/checkout`, `/api/webhook`) and dynamic pages. It had **no deploy path** — issue #7
(the landing-deploy spine) was parked, and CONTEXT.md described hosting only as
"CF Pages" without a chosen Next-on-Cloudflare adapter.

Partner/affiliate applications (Supabase, Stripe, GoDaddy) require live URLs under
`vybekiit.com` (integration docs, brand assets). Those links must resolve before the
applications can be submitted, which forced the landing live.

Two Cloudflare adapters were viable:

1. **`@cloudflare/next-on-pages`** — matches the older "CF Pages" wording, but is now in
   maintenance mode; Cloudflare steers new Next.js projects away from it.
2. **`@opennextjs/cloudflare`** — the current CF-recommended path for Next.js on Workers.
   Full SSR / API routes, active development.

## Decision

- **Adapter: `@opennextjs/cloudflare` on Workers** (not next-on-pages, not static export).
  Static export was rejected because it drops `/api/checkout` + `/api/webhook` (real SSR).
- **Config lives in `apps/landing`:** `open-next.config.ts` + `wrangler.jsonc`
  (`nodejs_compat`, assets binding). Scripts `cf:build` / `cf:preview` / `cf:deploy`.
- **Hosting account:** the personal Cloudflare account
  (`b0ba5fea46c96d72bfc6f12e1dafaf7b`, `yosefisabag@gmail.com`), pinned as `account_id`
  in `wrangler.jsonc`.
- **Custom domain:** `vybekiit.com` + `www` attached as Worker custom domains. The domain
  is registered at Namecheap; its nameservers were moved to Cloudflare
  (`meera`/`roman.ns.cloudflare.com`) so the zone is CF-managed and HTTPS auto-provisions.
- **The landing is still not a delivery mirror** (per ADR-0005). It ships from the monorepo
  via this Worker deploy; it is never scaffolded into a buyer repo.

## Consequences

- Deploy is `pnpm --filter vybekiit-landing cf:deploy` (build + upload) from `apps/landing`.
- SSR routes keep working (checkout/webhook run server-side on the Worker).
- **Auth gotcha:** wrangler 4.x auto-loads `apps/landing/.env.local`. A stale
  `CLOUDFLARE_API_TOKEN` there overrides OAuth and fails deploys with `9109`. Remove that
  key from `.env.local` (runtime checkout uses Lemon Squeezy, not the CF API) so
  `cf:deploy` uses the OAuth login.
- DNS for `vybekiit.com` is now entirely on Cloudflare — email/other records must be
  managed in the CF zone, not Namecheap.
- Resolves the parked landing-deploy half of issue #7.

## References

- `apps/landing/open-next.config.ts`
- `apps/landing/wrangler.jsonc`
- `apps/landing/next.config.mjs` (`initOpenNextCloudflareForDev`)
- ADR-0005 (delivery mirrors — the landing is not one)
- Live: https://vybekiit.com · https://vybekiit-landing.yosefisabag.workers.dev
