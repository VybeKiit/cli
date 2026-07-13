# ADR-0040 — 2026 free-tier hosting: promote GitHub Pages / Render / Netlify, add Deno Deploy, guardrail Vercel

- **Status:** Proposed — awaiting owner grill sign-off on the full decision. Drafted from 2026
  free-tier landscape research (2026-07-12). **§1 GitHub Pages slice: implemented 2026-07-12** —
  the buyer `HOSTING_PROVIDER=github-pages` adapter (reusing the Live-work provision boundary),
  doctor `gh` wiring, platform-skill wrapper, and CONTEXT hosting-row/skills-table edits are landed
  and green (deploy + cli suites, `checkProviderDispatch`). Render/Netlify/Deno Deploy promotion +
  the Vercel guardrail + ladder reorder remain proposed. Remaining SSOT edits on full acceptance.
- **Date:** 2026-07-12
- **Deciders:** Yosef (owner) — pending

Extends [ADR-0002](./0002-multi-provider-adapters.md) (one interface + swappable adapters),
[ADR-0006](./0006-vercel-hosting-adapter.md) (Vercel), [ADR-0017](./0017-railway-stack-adapter.md)
(Railway coupled stack), and **amends the host ladder of**
[ADR-0039](./0039-provider-preference-ladder-and-live-work.md). Every promotion below routes through
`resolveEnvProvider` per [ADR-0018](./0018-provider-dispatch-ssot.md) via the
`extend-provider-dispatch` maintainer skill — no hand-rolled `switch` on `*_PROVIDER`.

## Context

The kit exists so a **vibe coder** can ship a **money-making** product. Hosting therefore has a
sharper bar than "free": it must be free **and** allow commercial use. Two 2026 shifts change which
hosts clear that bar:

1. **The free-tier purge hit backends.** Heroku (gone), **Fly.io** (no free tier for new signups;
   card required), **Railway** (free tier effectively gone — $5 trial → $1/mo, CDN disabled May
   2026), and **Koyeb** (free tier **closed to new users** after the Feb 2026 Mistral AI
   acquisition). The always-free full-stack backend slot Railway used to fill is now empty.
2. **"Free" ≠ "usable for a paid product."** **Vercel's Hobby (free) plan forbids commercial use** —
   a direct contradiction of the kit's reason to exist. **Netlify** moved to credit-based free (300
   credits/mo). The hosts that are free **and** commercial-use-OK are a short list: **Cloudflare
   Pages/Workers⭐, GitHub Pages, Render, Netlify, Deno Deploy**.

Meanwhile the kit already **provisions** Render, Netlify, and GitHub Pages in Live work
(`packages/deploy/src/liveWork/{render,netlify,githubPages}Provision.ts`; A12b/A12c in the wiring
checklist — GitHub Pages and Render live-green), and the host **Preference ladder** already lists
them (ADR-0039). But they are **not** buyer-facing `HOSTING_PROVIDER` values: the enum is still
`cloudflare | vercel | aws | railway` (`packages/deploy/src/types.ts:9`, `packages/core/src/config.ts:203`),
there is no `providers/{render,netlify,githubPages}/` factory, no `doctor` toolchain entry, and no
`deploy-*-vybekiit.md` platform-skill wrapper. `ladders.ts` flags this directly: *"render is
ladder-first … before it is a full HOSTING_PROVIDER schema value (create path next)."*

So the free-commercial breadth exists for demo/dogfood, but a buyer **cannot pin
`HOSTING_PROVIDER=github-pages`** for their own $0 commercial deploy. That is the gap. Full landscape
and sources: [docs/hosting-free-tier-2026.md](../hosting-free-tier-2026.md).

## Decision

### 1. Promote three Live-work hosts to buyer-facing adapters (reuse, don't rebuild)

Promote **`github-pages`**, **`render`**, **`netlify`** from Live-work-only provisioners to full
`Hosting` adapters, **reusing the existing `liveWork/*Provision.ts` create paths as the deploy
boundary** (SSOT — no second implementation). Each promotion, per ADR-0018 via
`extend-provider-dispatch`:

- **Enum** — add to `HostingProviderName` (`packages/deploy/src/types.ts`) and the `HOSTING_PROVIDER`
  literal (`packages/core/src/config.ts`).
- **Config** — minimal schema per host: `github-pages` needs none beyond `gh` auth (repo-owned,
  no token in `.env` per ADR-0001); `render` `RENDER_*` (owner id / static repo); `netlify`
  `NETLIFY_AUTH_TOKEN` via the secure doctor write path.
- **Factory** — `providers/<name>/provider.ts` implementing `Hosting`, delegating to the existing
  provision fn behind an injectable runner (same shape as `cloudflare` / `vercel`).
- **Resolve** — registry entry in `makeHostingFactories` (`packages/deploy/src/resolve.ts`) — never a
  new `switch` branch.
- **Doctor** — toolchain entry in `resolveHostingTool` (`cli/src/doctor/toolchain.ts`):
  `github-pages` → `gh`; `render` / `netlify` → API-key probe (no CLI required).
- **Platform-skill wrapper (OWNED)** — `templates/web/.vybekiit/platform-skills/deploy-<name>-vybekiit.md`,
  goal-named, linking official docs. `go-live` stays goal-named — Decide + Guide unchanged.

**Order:** `github-pages` **first** — live-green, zero config, no cold starts, tied to the repo the
kit already owns; ideal $0 default for the **spa / extension popup / static web** targets. Then
`render` (free full-stack + Postgres — warn cold-start + 90-day DB expiry), then `netlify`.

### 2. Add one net-new adapter: Deno Deploy

Add **`deno-deploy`** as a net-new edge `Hosting` adapter: generous free tier (1M req/mo, 100 GB
egress, KV), **commercial use explicitly allowed**, clean `deno deploy` / `deployctl` CLI + a
zero-secret GitHub Action (OIDC), and Next.js SSR support (recently added). It is the free,
commercial-OK **edge** complement to Cloudflare Workers for the **backend/API** and **web**
templates. Same six-step promotion contract as §1. Config: `DENO_DEPLOY_TOKEN` (or GH-Action OIDC,
no secret). Build against the current built-in `deno deploy` path (new orgs), not Classic
`deployctl`; pin `deno` docs as the platform skill.

### 3. Guardrail Vercel free (commercial-use trap)

Vercel stays a supported adapter (ADR-0006), but `doctor` and the `go-live` platform-skill wrapper
**must warn** when `HOSTING_PROVIDER=vercel` with no paid plan detected: Vercel Hobby forbids
commercial use. In buyer voice (no jargon): *"This host is free only for personal projects — to sell
on it you'll need their paid plan. Want me to put you on a free-for-business host instead?"* — and
steer to `cloudflare` (default), `deno-deploy`, or `github-pages`. This is a **guide** step, not a
provider menu (Decide + Guide holds).

### 4. Relabel Railway free expectation

Railway (ADR-0017) remains the opt-in **coupled stack**, but onboarding/copy must stop implying a
free tier: it is effectively paid ($5 trial → $1/mo, CDN off May 2026). No adapter code change — a
copy/expectation fix in the Railway platform-skill wrapper and any "free" framing.

### 5. Amend the host Preference ladder to free-commercial-first

Reorder the ADR-0039 shared host ladder (`packages/deploy/src/liveWork/ladders.ts` SSOT, used by
both the console and buyer skills) to lead with hosts that are free **and** commercial-use-OK, and
**remove Vercel from the auto-hop ladder** — never auto-hop a money-making app onto a
commercial-blocked free plan:

- **Old:** `cloudflare → render → railway → vercel → netlify → github-pages`
- **New:** `cloudflare → github-pages → deno-deploy → render → netlify → railway`

Vercel and AWS remain valid pins via **Named vendor stick** / explicit choice, but are **not**
auto-hop targets. Named vendor stick still overrides the ladder in all cases. `DOGFOOD_APEX`
subdomain rules from ADR-0039 §3 are unchanged.

## Consequences

- **Buyer `HOSTING_PROVIDER` grows** `cloudflare | vercel | aws | railway`
  `→ + github-pages | render | netlify | deno-deploy`. On acceptance, the SSOT edits: CONTEXT.md:198
  hosting row, the platform-skills table (CONTEXT.md ~466–468), and LANGUAGE.md **Supported tools** —
  done as the acceptance edit, not in this proposal.
- **§1 is low incremental cost** — create paths, unit tests, and live e2e (A12b/A12c) already exist;
  promotion is enum + factory-shim + doctor + wrapper, not new provisioning logic.
- **Four more adapters to keep green** — accepted cost of breadth (same stance as ADR-0002/0006/0017).
  Deno Deploy is the only genuinely new surface.
- **Defaults unchanged** — Cloudflare⭐ + Supabase still ship as the default stack; ADR-0001 default
  toolchain (`wrangler` + `supabase`) is untouched. New hosts are "also supported," pinned only when
  chosen or won via Free-tier hop.
- **Guardrails buy owner-trust** — the Vercel-free warning and Railway relabel stop a vibe coder from
  unknowingly shipping a paid product on a commercial-blocked / again-paid host.
- **Ladder reorder is try-order only** — ADR-0018 still holds: one active adapter per concern after
  pin; the ladder is order-before-pin, and Named vendor stick still wins.

## Alternatives rejected

- **Add Koyeb** — its free tier **closed to new users** after the Feb 2026 Mistral AI acquisition; a
  new buyer can't get it. Revisit only if a free tier returns.
- **Add Fly.io (free)** — **no free tier for new signups**, card required; contradicts the $0 goal.
  May later be added as a *paid* container option, but not under this "free" decision.
- **Keep Render / Netlify / GitHub Pages Live-work-only** — leaves real, already-built
  free-commercial hosts unreachable by buyers; ADR-0002 breadth exists precisely for buyer choice via
  one env value.
- **Rebuild buyer adapters separately from the Live-work provisioners** — violates SSOT; the deploy
  boundary must be shared.
- **Promote Vercel free as a headline $0 option** — it forbids commercial use; wrong for a
  money-making kit.

## References

- Evidence base + sources: [docs/hosting-free-tier-2026.md](../hosting-free-tier-2026.md) (verified
  July 2026)
- Live-work state: [docs/live-work-wiring-checklist.md](../live-work-wiring-checklist.md) — A12b/A12c
- Glossary in [LANGUAGE.md](../../LANGUAGE.md): **Preference ladder**, **Free-tier hop**,
  **Named vendor stick**, **Decide + Guide**
- Code touch-points: `packages/deploy/src/types.ts:9`, `packages/core/src/config.ts:202`,
  `packages/deploy/src/resolve.ts` (`makeHostingFactories`), `packages/deploy/src/liveWork/*Provision.ts`,
  `packages/deploy/src/liveWork/ladders.ts`, `cli/src/doctor/toolchain.ts` (`resolveHostingTool`)
