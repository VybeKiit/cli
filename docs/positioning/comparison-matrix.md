# Master Comparison Matrix

> All data verified **2026-06-27** from official sites, GitHub, and corroborating reviews.
> Prices are the **entry/lowest paid tier** unless noted; many kits list higher team/agency tiers.
> ✅ = ships out of the box · ⚠️ = partial / locked to a higher tier / **unverified** · ❌ = absent.
> **Pricing in this market moves constantly** (discount timers, tier renames) — re-check before
> publishing. ShipFast in particular appears as $129/$199/$299 across sources.

Legend for **AI/agent posture** (the axis that matters most for VybeKiit):
- **Operator** — the agent runs the build for a non-developer (decides, guides, verifies). *VybeKiit only.*
- **Autonomous dev loop** — agent writes code in a developer's SDLC (specs, CI, diffs).
- **Codebase context** — `AGENTS.md`/`CLAUDE.md`/MCP that makes a *developer's* AI assistant better at editing.
- **Runtime AI** — pre-wired LLM APIs for the end-product's features (not a dev-workflow agent).
- **None.**

---

## A · Model, price, platforms, updates

| Product | Type | Entry price | Web | Mobile | Extension | Updates model |
|---|---|---|:--:|:--:|:--:|---|
| **VybeKiit** | Paid one-time | **$29** *(parked; likely to rise)* | ✅ Next.js+shadcn (RTL) | ✅ Expo | ✅ WXT | **npm version bumps** (no git merge) |
| Open SaaS (Wasp) | Open-source | $0 | ✅ | ❌ | ❌ | git pull |
| Next.js SaaS Starter | Open-source | $0 | ✅ | ❌ | ❌ | git pull |
| mickasmt next-saas-stripe | Open-source | $0 | ✅ | ❌ | ❌ | git pull |
| ixartz SaaS-Boilerplate | Freemium + paid | $0 / $399–$1,799 | ✅ | ❌ | ❌ | git pull / 1-yr updates (paid) |
| KolbySisk next-supabase-stripe | Open-source | $0 | ✅ | ❌ | ❌ | git pull |
| Project Forge | Open-source | $0 | ✅ | ❌ | ❌ | git pull |
| CMSaasStarter (SvelteKit) | Open-source | $0 (+infra) | ✅ | ❌ | ❌ | git pull |
| ShipFast | Paid one-time | $199–$299 | ✅ | ❌ | ⚠️ separate product (ExtensionFast) | lifetime (git) |
| MakerKit | Paid one-time | $299–$649 *(free OSS tier)* | ✅ | ⚠️ free Expo preview, unsupported | ❌ | lifetime (git) |
| Supastarter | Paid one-time | $349–$1,499 | ✅ Next/Nuxt/TanStack | ❌ | ❌ | lifetime (git) |
| SaaSykit (Laravel) | Paid one-time | $239–$299 +VAT | ✅ | ❌ | ❌ | lifetime (git) |
| AnotherWrapper | Paid one-time | $249–$999 | ✅ | ❌ | ❌ | lifetime (git), 14-day refund |
| Shipped.club | Paid one-time | $157–$207 | ✅ | ❌ | ✅ Chrome ($207 tier) | lifetime (git) |
| useSAASkit | Paid one-time | $149 web / $249 mobile *(separate)* | ✅ | ✅ (separate purchase) | ❌ | lifetime; ⚠️ "last updated 9 mo ago" |

**Reading it:** VybeKiit is the **only** kit that bundles web + mobile + extension in one purchase,
and the **only one whose updates land as `npm install` instead of a git merge** — the single
property that makes "lifetime updates" real for a buyer who can't resolve a conflict.

---

## B · Feature coverage

| Product | Auth | Multi-tenant | RBAC | i18n | Email | Storage | Jobs | Admin panel | Blog/SEO | Tests/CI |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **VybeKiit** | ✅ better-auth/Cognito | ❌ *(agent builds on request)* | ❌ *(agent builds)* | ✅ auto-localized + RTL | ✅ CF/SES/Resend | ✅ Supabase·R2/S3 | ⚠️ CF cron only | ❌ | ⚠️ landing dogfood, no blog engine | ✅ tests-first + CI |
| Open SaaS | ✅ +4 OAuth | ❌ | ❌ (isAdmin bool) | ❌ | ✅ | ✅ S3 | ✅ pg-boss | ✅ TailAdmin | ✅ | ⚠️ e2e only |
| Next.js SaaS Starter | ⚠️ email/pw only | ✅ teams | ✅ Owner/Member | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| mickasmt | ✅ Auth.js v5 | ❌ | ✅ User/Admin | ❌ | ✅ Resend | ❌ | ❌ | ✅ | ✅ MDX | ⚠️ unverified |
| ixartz | ✅ Clerk/Better Auth | ✅ | ✅ | ✅ | ⚠️ Max tier only | ❌ | ❌ | ⚠️ impersonation only | ⚠️ SEO, no blog | ✅ full |
| KolbySisk | ✅ Supabase | ❌ | ❌ | ❌ | ✅ Resend | ❌ | ❌ | ❌ | ❌ | ❌ |
| Project Forge | ✅ Supabase | ✅ teams | ✅ basic | ❌ | ⚠️ optional | ❌ | ❌ | ⚠️ dashboard CRUD | ❌ | ✅ 6-stage CI |
| CMSaasStarter | ✅ Supabase | ❌ | ❌ | ⚠️ community branch | ✅ SMTP (off default) | ❌ | ❌ | ⚠️ account dash | ✅ blog+RSS+sitemap | ✅ |
| ShipFast | ✅ Google+magic | ❌ | ❌ | ❌ | ✅ Mailgun/Resend | ❌ | ❌ | ❌ | ✅ | ❌ |
| MakerKit | ✅ MFA+passkeys | ✅ best-in-class | ✅ +Super Admin | ✅ | ✅ React.Email | ✅ Supabase | ❌ | ✅ Super Admin | ✅ | ✅ Playwright+Vitest |
| Supastarter | ✅ Better Auth | ✅ | ✅ | ✅ | ✅ | ✅ S3 | ✅ Trigger.dev/QStash | ✅ | ✅ | ⚠️ Playwright, no CI tmpl |
| SaaSykit | ✅ 2FA/OTP | ✅ Tenancy tier | ✅ | ✅ | ✅ SES/Postmark/… | ⚠️ Laravel native | ⚠️ Laravel native | ✅ Filament +MRR/churn | ✅ | ⚠️ tests, CI undoc |
| AnotherWrapper | ✅ Better Auth | ❌ | ❌ | ❌ | ✅ Resend/Loops | ✅ R2 | ❌ | ❌ | ✅ | ❌ |
| Shipped.club | ✅ 60+ social | ⚠️ basic workspaces | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| useSAASkit | ✅ Supabase | ✅ orgs | ✅ | ⚠️ web tier only | ✅ Resend | ⚠️ unverified | ⚠️ unverified | ✅ super admin | ⚠️ web tier only | ⚠️ unverified |

**Honest reading:** On a raw B2B feature checklist, **MakerKit, Supastarter, and SaaSykit are
ahead** of VybeKiit — they ship multi-tenancy, RBAC, admin dashboards, and (Supastarter) background
jobs pre-built. VybeKiit deliberately does **not** compete here; see `differentiation.md` → "The
honest gap." Where VybeKiit *does* lead the feature table: **i18n by default** (auto-localized +
RTL from v1), **provider-agnostic adapters** behind every concern, and a **tests-first CI gate**
that most one-time kits skip entirely.

---

## C · Payments, Merchant-of-Record, AI/agent posture, ICP

| Product | Payment providers | MoR by default? | AI/agent posture | Primary ICP |
|---|---|:--:|---|---|
| **VybeKiit** | Lemon Squeezy · Stripe · PayPal | ✅ **LS default** | **Operator** (non-dev) | Semi-technical "vibe coder" w/ Claude/Codex sub |
| Open SaaS | Stripe · Polar · Lemon Squeezy | ⚠️ optional | Codebase context (+OpenAI demo) | Indie devs OK with Wasp/Fly.io |
| Next.js SaaS Starter | Stripe | ❌ | None | Devs wanting an official reference |
| mickasmt | Stripe | ❌ | None | Solo devs / learning |
| ixartz | Stripe | ❌ | Codebase context (AGENTS.md, paid) | Mid/senior Next.js devs |
| KolbySisk | Stripe | ❌ | None | Devs wanting a minimal base |
| Project Forge | Stripe | ❌ | **Autonomous dev loop** (Ralph++) | Claude Code power users |
| CMSaasStarter | Stripe | ❌ | None | SvelteKit indie devs |
| ShipFast | Stripe · Lemon Squeezy | ⚠️ optional | None (DX-friendly only) | Solo founders shipping fast |
| MakerKit | Stripe · Lemon Squeezy · Paddle | ⚠️ optional | **Codebase context** (MCP v2, 56+ tools) | Devs/teams building B2B SaaS |
| Supastarter | Stripe · LS · Polar · Creem · Dodo | ⚠️ optional | Codebase context (Claude-ready) | Indie devs / small agencies |
| SaaSykit | Stripe · Paddle · LS · Polar · Creem | ⚠️ optional | None (AI-friendly copy only) | Laravel/PHP devs |
| AnotherWrapper | Stripe · Polar · LemonSqueezy | ⚠️ optional | **Runtime AI** (7–8 demo apps, 6+ LLMs) | Indie devs building AI wrappers |
| Shipped.club | **Lemon Squeezy (default)** · Stripe | ✅ LS default | Runtime AI (multi-LLM) | Price-sensitive indie founders |
| useSAASkit | Stripe (LS ⚠️ unverified) | ❌ | Runtime AI (AI chat/PDF demos) | Indie founders, web+mobile |

**Reading it:** Only **two** kits default to a Merchant of Record (VybeKiit and Shipped.club) — the
property that removes global VAT/tax filing, the scariest part for a non-US solo builder. And only
**VybeKiit** treats the agent as the **operator for a non-developer**; every other "AI" entry,
including the strongest (Project Forge, MakerKit), is tooling that assumes a developer stays in the
loop reading code.

---

## Where each rival is genuinely strong (don't pretend otherwise)

- **Open SaaS** — the most complete *free* option; YC-backed, 14k★, AGENTS.md + skills already shipped.
- **MakerKit** — deepest B2B billing + multi-tenancy + the strongest agent *codebase* tooling (MCP v2).
- **Supastarter** — most feature-complete paid kit; 5 payment providers, jobs, framework choice.
- **SaaSykit** — best for the Laravel world; built-in MRR/churn analytics, multi-tenant seat billing.
- **AnotherWrapper** — best if the product itself is an AI wrapper (7–8 working AI demo apps).
- **Project Forge** — most advanced agent SDLC harness (autonomous loop) — for engineers, not vibe coders.
- **ShipFast** — biggest community + proven across 27+ of the creator's own shipped products.
- **Shipped.club** — closest on *model* (LS-default MoR + a Chrome extension tier) at a low price.
- **useSAASkit** — only other kit with a mobile story; documentation rated best-in-class.

See [`competitors/`](./competitors/) for the full per-rival breakdown.
