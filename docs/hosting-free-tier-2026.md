# Hosting free-tier landscape — 2026

> Evidence base for [ADR-0040](./adr/0040-free-tier-hosting-adapters.md). **Verified July 2026** —
> free tiers shift constantly; re-verify a host's pricing page before relying on a row.
> Maintainer reference (not buyer-facing). Domain terms in [LANGUAGE.md](../LANGUAGE.md).

## The lens

Because the kit ships **money-making** products for **vibe coders**, a host earns a place in the free
path only if it clears four bars, in order:

1. **Free in 2026** — a real free tier a new signup can get today (not a trial, not legacy-only).
2. **Commercial use allowed on free** — the buyer is selling. This disqualifies otherwise-great free
   tiers (see Vercel Hobby).
3. **Fits a template** — web (Next.js), spa (Vite), backend (Express), extension, mobile static.
4. **Clean CLI/API for an adapter** — a scriptable deploy boundary the `Hosting` interface can wrap.

## Landscape (verified July 2026)

| Host | Free in 2026? | Commercial on free? | Best-fit template | Adapter mechanism | Kit status → action |
|---|---|---|---|---|---|
| **Cloudflare** Pages/Workers ⭐ | ✅ most generous — unlimited egress; D1/R2/KV free | ✅ | all | `wrangler` | Full adapter + default — **keep** |
| **GitHub Pages** | ✅ truly free static, no cold start | ✅ | spa · extension popup · static web | git push + `gh` API | Live-work only (live-green) → **promote (1st)** |
| **Deno Deploy** | ✅ 1M req/mo · 100 GB egress · KV | ✅ | backend/edge · web SSR | `deno deploy` / `deployctl` / GH Action | Not supported → **add (net-new)** |
| **Render** | ✅ free web svc + Postgres (cold start; DB 90-day) | ✅ | backend · web SSR · spa | REST API / `render.yaml` | Live-work only (live-green) → **promote** |
| **Netlify** | ✅ free, now credit-based (300 credits/mo) | ✅ | web · spa | REST API / CLI | Live-work only → **promote** |
| **Vercel** | ✅ Hobby | ❌ **bans commercial use** | web (Next.js) | `vercel` CLI | Full adapter → **guardrail (warn on free)** |
| **Railway** | ⚠️ ~gone — $5 trial → $1/mo; CDN off May '26 | ✅ (paid) | backend + DB (coupled) | `railway` CLI | Full adapter → **relabel (not free)** |
| **Koyeb** | ❌ closed to new users (Mistral acq. Feb '26) | — | — | `koyeb` CLI | **Skip** (rejected) |
| **Fly.io** | ❌ no free for new signups (card required) | — | — | `flyctl` | **Skip** for free goal |
| **Oracle Cloud** Always Free | ✅ generous, but raw VM | ✅ | (DevOps-heavy) | SSH / Terraform | **Skip** — non-coder-hostile |

⭐ = kit default.

## Per-host notes (the actionable ones)

- **Cloudflare** — why it's the default: unlimited egress, edge, free D1/R2/KV, commercial-OK. Only
  ceiling is the Workers CPU model for heavy compute.
- **GitHub Pages** — zero cost, zero cold start, tied to the buyer's repo the kit already owns.
  Static only (no SSR/backend) — perfect for spa / extension / landing. Teardown needs the
  `delete_repo` scope (`gh auth refresh -s delete_repo`).
- **Deno Deploy** — the free, commercial-OK **edge** complement to Cloudflare. 1M req / 100 GB, KV,
  GH-Action OIDC (no stored secret), Next.js SSR recently added. New orgs use built-in
  `deno deploy`; Classic uses `deployctl` — build against the current one.
- **Render** — best free **full-stack + Postgres**; the free web service cold-starts after 15 min
  inactivity (~30–60 s) and the free Postgres **expires after 90 days** — warn the buyer. Static
  sites don't cold-start.
- **Netlify** — framework-agnostic; edge functions run on the Deno runtime. Free is now 300
  credits/mo (builds 15, bandwidth 10/GB) — less predictable than flat limits; legacy accounts keep
  the old 100 GB + 300 build-min model.
- **Vercel** — best Next.js DX, but **Hobby forbids commercial use** — the single biggest trap for a
  money-making kit. Support it, but warn + steer on free.
- **Railway** — great DX, but the free tier is effectively gone; treat as a paid coupled stack.
- **Koyeb / Fly.io** — both removed free access in the 2025–26 purge (Koyeb via the Mistral
  acquisition; Fly.io card-gated). Out for the free goal.

## Not deploy targets — positioning note

Bolt.new, Lovable, v0, and Replit are vibe-coding **competitors** with built-in, lock-in hosting —
not deploy targets to adapt. The kit's edge is the opposite: **owned, portable code** + a real
Merchant-of-Record / data stack. Worth a line in positioning, not a `Hosting` adapter.

## How this maps to the kit

Decision and rollout live in [ADR-0040](./adr/0040-free-tier-hosting-adapters.md): promote
GitHub Pages → Render → Netlify to buyer `HOSTING_PROVIDER` adapters (reusing the existing
`liveWork/*Provision.ts` create paths), add Deno Deploy, guardrail Vercel-free, relabel Railway, and
reorder the shared host Preference ladder to free-commercial-first.

## Sources (verified July 2026)

- [Render — platforms with a real free tier in 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- [Appwrite — best free hosting platforms 2026](https://appwrite.io/blog/post/free-hosting-platform)
- [HostingAdvice — free hosting, no credit card (June 2026)](https://www.hostingadvice.com/how-to/free-hosting-services-with-no-credit-card/)
- [agentdeals — Vercel vs Netlify vs Render vs Cloudflare vs Railway free-tier 2026](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [snapdeploy — every free cloud deploy platform 2026, ranked](https://snapdeploy.dev/blog/free-cloud-deployment-platforms-2026-comparison)
- [saaspricepulse — Railway pricing history / free tier 2026](https://www.saaspricepulse.com/blog/railway-pricing-history)
- [Koyeb free tier & Mistral acquisition (srvrlss.io)](https://www.srvrlss.io/provider/koyeb/)
- [Deno Deploy pricing & limits](https://deno.com/deploy/pricing) · [deployctl](https://github.com/denoland/deployctl) · [Next.js on Deno Deploy](https://deno.com/blog/nextjs-on-deno-deploy)
- [Lovable — best vibe coding tools 2026](https://lovable.dev/guides/best-vibe-coding-tools-2026-build-apps-chatting)
