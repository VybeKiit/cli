# Shipped.club — Alternative & Comparison

> **Type:** Paid one-time · **Price:** $157 (SaaS) / $207 (SaaS + Chrome Extension) · **Platforms:** Web + Chrome extension · **Last verified:** 2026-06-27
> Master data: [../comparison-matrix.md](../comparison-matrix.md) · Positioning: [../differentiation.md](../differentiation.md)
> **Note:** the nearest competitor on *model* — see [../differentiation.md](../differentiation.md) §7.

**Stack:** Next.js 14, TypeScript, Prisma (Postgres/MySQL/MongoDB), NextAuth + Supabase Auth, Lemon
Squeezy (default) + Stripe, Vercel AI SDK.

**What it is:** A TypeScript-first Next.js boilerplate for indie hackers shipping web SaaS quickly —
with auth, payments, email integrations, a markdown blog, and pre-built AI service connections. The
$207 tier adds a React Chrome-extension boilerplate.

**Where it's strong:**
- **Lemon Squeezy as default payment processor** — handles global VAT/tax out of the box (the rare
  rival that *defaults* to MoR, like VybeKiit)
- Broad AI provider support (OpenAI, Anthropic, Gemini, Groq, Ollama, DeepSeek) for AI features
- **Chrome extension boilerplate included** at $207 — uncommon in the space
- Lifetime updates with a stated weekly cadence; multi-DB via Prisma
- Lower price than ShipFast

**Where VybeKiit differs / wins:**
- Shipped.club delivers **code**; VybeKiit delivers an **agent layer** that makes every technical
  decision and verifies each step worked before advancing — the buyer never reads a diff
- Updates arrive as npm version bumps on `@vybekiit/*`, not git merges — "lifetime updates" that work
  for someone who can't resolve a merge conflict
- **Three platforms** in one purchase: web + Expo **mobile** + extension — Shipped.club has no mobile
- Provider-agnostic adapters (LS · Stripe · PayPal; Supabase · MongoDB · AWS; better-auth · Cognito)
  routed by one setting — the agent picks, not the builder
- Goal-named skills (go-live, setup-payments, doctor) guide a non-technical buyer to a live, paying
  app in session one; Shipped.club assumes the buyer can read docs and wire things together
- RTL-ready web template and multilingual agents from v1; Shipped.club has no i18n

**Honest — where Shipped.club may be the better pick:**
- A longer track record and a working LS-default + Chrome-extension model at a low price — less
  execution risk for an experienced developer who just wants a scaffold.
- More opinionated, battle-tested Next.js patterns; better for a senior dev who wants full control and
  no agent intermediary.

---
*Maps to a future `/shipped-club-alternative` page. Re-check before publishing.*
