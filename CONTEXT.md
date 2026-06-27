# VybeKiit — Context & Blueprint

> The domain map for VybeKiit. Read this first. It captures **what** we're building, the
> **decisions** behind it, and the **language** we use. Implementation details live in code;
> this file is the why and the shape. Authored from a `/grill-me` session on 2026-06-27,
> extended by a `/grill-with-docs` session the same day (see "Agentic toolchain & dev workflow").
> **Status: v1.0 scaffold built + green + pushed; building out the web tracer bullet.**

---

## What VybeKiit is

A **paid, GitHub-distributed monorepo starter kit** that lets a non-technical builder ship a
real, money-making product (web, then mobile, then browser extension) by *describing* what they
want to an AI agent — without ever having to *understand* the plumbing.

The product is **not** the boilerplate. Every boilerplate is commodity. The product is the
**agent layer**: the skills, docs, and contracts that let Claude/Codex carry a vibe coder from
"I bought this" to "my app is live and taking payments" — making every technical decision for
them and translating the few unavoidable manual steps into plain language.

## Who it's for (ICP)

The **semi-technical vibe coder**: has a Claude or Codex subscription, can clearly describe what
they want to build, but does **not** want to understand environment variables, deploys, or merge
conflicts. Not a true zero-code novice (they aren't shopping for a "monorepo"); not a senior dev
(they'd build their own). It also doubles as **brand / lead-gen** for the author.

---

## The architectural backbone: Owned vs Maintained

Every file in a buyer's world is exactly one of these. This single split resolves the central
tension — "maintained updates" for "an audience that can't read a diff."

| | **MAINTAINED** | **OWNED** |
|---|---|---|
| What | headless logic | app shell + ALL UI + the agent layer |
| Lives as | public npm `@vybekiit/*` packages | files copied into the buyer's scaffolded repo |
| Buyer edits? | never | freely |
| Updates | flow as **npm version bumps** (conflict-free) | frozen — never auto-clobbered |
| Examples | `core/config`, `pay-*`, `auth`, `email`, `db`, `agent-kit` | `templates/web`, UI components, screens, skills |

Updates are **version bumps, not git merges** — the only kind of update a non-coder's agent can
apply safely every time.

## Repo structure

```
vybekiit/                      private monorepo · pnpm + Turborepo
├─ packages/                  MAINTAINED · public npm @vybekiit/* · headless · updates flow
│  ├─ core/                   env+config loader (the single .env source of truth), types, utils
│  ├─ payments/               one PaymentProvider interface · providers/{lemon-squeezy,stripe,
│  │                          paypal} (official SDKs) · LS is the v1 default (MoR) · no UI
│  ├─ auth/                   headless auth logic (Supabase)
│  ├─ db/                     typed Supabase client + schema helpers
│  ├─ extension-publish/      Playwright Chrome-Web-Store automation (publish/submit extensions
│  │                          for the builder) — MAINTAINED so selector-drift fixes ship via npm;
│  │                          the OWNED templates/extension consumes it (v3)
│  ├─ email/                  send via Cloudflare email behind one interface          ← later
│  └─ agent-kit/              the kit-update logic + scripts the agents run            ← later
├─ templates/                 OWNED · NOT published · copied by the scaffolder · frozen
│  ├─ web/                    Next.js + shadcn (RTL-ready) + agent layer    ← v1.0
│  ├─ mobile/                 Expo + NativeWind/react-native-reusables       ← v2
│  └─ extension/              WXT + shadcn                                    ← v3
├─ apps/landing/              marketing site — built WITH templates/web (dogfood) · CF Pages
├─ cli/                       npx vybekiit — scaffolds a template into the buyer's own repo
└─ AGENTS.md CLAUDE.md CONTEXT.md   ← MAINTAINER agent layer (this repo, technical voice)
```

Two agent layers, same filenames, different audiences: the **maintainer** layer (repo root,
technical — for us) vs the **buyer** layer (inside `templates/*`, jargon-free — ships to buyers).

## Stack decisions

| Concern | Choice | Dropped / why |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | — |
| Web UI | shadcn/ui (web + extension share it) | MUI etc. — can't mix design systems; shadcn is best for agents |
| Mobile UI | NativeWind + react-native-reusables (shadcn-parity) | — shadcn is web-only |
| Hosting/edge | Cloudflare (Pages/Workers, CDN, domains, cron, R2, email) | AWS — bill-shock + non-coder-hostile |
| DB / Auth | Supabase (Postgres + Auth + Storage) | — batteries-included beats assembling D1 + auth |
| Email | Cloudflare Email | AWS SES (sandbox approval pain), Resend (kept as fallback) |
| Payments | swappable packages; **Lemon Squeezy first** | LS is Merchant-of-Record → handles tax/VAT (the scary part) |

## The agent layer (the actual product)

- **Contract — "Decide + Guide":** the agent makes *all* technical decisions and never speaks
  jargon. For the few steps only the buyer can do (paste a key, approve a store submission), it
  gives exact, plain-language, one-step-at-a-time instructions. Promise: *you never have to
  understand or decide — just follow simple steps.* (Not "you never see anything technical" —
  that's impossible and breeds refunds.)
- **Docs (single source + pointers):** `AGENTS.md` is the one source of truth; `CLAUDE.md` /
  Copilot / Codex configs are thin redirects. `CONTEXT.md` = domain map. `language.md` =
  voice/jargon glossary ("secret setting" not "env var").
- **9 skills, one strict shared template.** Every skill obeys: ① one action at a time ·
  ② **verify-before-advance** (test the step worked before continuing — this prevents the
  silent-stuck → refund death) · ③ plain language · ④ errors translated to "what happened + the
  one fix" · ⑤ celebrate progress. Routed via an AGENTS.md goal-index (buyer speaks goals, agent
  picks the skill).
  - **Tier 1** (agent would botch without these): `onboarding` · `go-live` · `setup-payments` ·
    `update-kit` · `doctor`
  - **Tier 2**: `setup-auth` · `add-data` · `buy-domain` · `setup-email`
  - **Not skills** (agent + AGENTS.md handle them): generic coding, design tweaks, CRUD.
- **Keystone:** `onboarding` ends with the buyer's app **LIVE** in session #1. That "aha" kills
  refund-regret and is also the marketing demo.

## Quality

Agent writes **tests-first** (that loop is the real "no bugs" gate, and what makes `update-kit`
safe). Pre-commit is **lenient** (format + lint only — never traps a buyer behind red). The heavy
gate (full tests + typecheck) runs in **CI**, where a failure is a check the *agent* fixes, not a
wall the *buyer* hits.

In the **maintainer monorepo only**, a husky **pre-push** mirrors CI exactly (lint → typecheck →
test → build) — it's our stand-in for branch protection (unavailable on the free GitHub plan) and
the guard that keeps `main` green when we land via tiny squash-PRs. It is **never** shipped to a
buyer's scaffolded repo (a blocking pre-push would re-create the refund-trap CI was designed to
avoid). TypeScript is **max-strict everywhere** (`exactOptionalPropertyTypes`, `noImplicitReturns`,
`noUncheckedSideEffectImports` on top of `strict` + `noUncheckedIndexedAccess`); Biome owns
unused-vars / `any` / unreachable so tsconfig doesn't double-own them.

## Distribution, gating & updates

- Packages are **public** (free updates via npm, double as marketing). The wall is the **private
  repo**: Lemon Squeezy checkout collects the buyer's GitHub username → webhook → **invite** =
  the single gate. Refund → access removed. One bundle (all platforms).
- Moat is **not** code secrecy (boilerplate is always pirateable) — it's updates + the agent
  layer + convenience + brand.

## Business model

- **Price:** $29 one-time, best-effort updates. ⚠ **PARKED / flagged:** underprices the designed
  value and maximizes support load; the highest-EV decision to revisit before launch.
- **Support:** kit-only boundary (we fix the kit; we do *not* debug buyers' custom code or their
  agent's output). First line = the agent + the `doctor` skill + a community. No 1:1 at $29.
- **GTM:** deferred to a friend. ⚠ Distribution is the #1 unowned risk — loop them in early; the
  product's best ad (live-in-15 demo) is baked into onboarding.
- **Legal:** 14-day no-questions refund (access revoked — kills chargebacks). Public packages
  MIT; templates + agent layer proprietary EULA (buyer builds unlimited own products incl.
  commercial; no redistribute/resell/compete). Terms: as-is, no warranty, liability capped at
  price, best-effort updates with no compatibility guarantee. LS (Merchant of Record) handles tax.

## Build order — the tracer bullet

Build **one thin vertical slice through every layer**, cutting the riskiest unknowns first.

- **v1.0** — WEB only + the **money pipeline** (LS → invite, *de-risk this first*) +
  packages `core` / `payments` / `auth` / `db` + skills `onboarding` / `setup-payments`
  / `go-live` / `doctor` + the dogfooded landing page. Goal: a stranger pays → gets invited →
  scaffolds a web app → wires payments → deploys **live**.
- **v1.1** — `update-kit`, `setup-auth`, `add-data`, `buy-domain`, `setup-email` (Stripe + PayPal
  adapters already ship in `@vybekiit/payments`).
- **v2** — mobile template (Expo + the author's `launch-store` for deploy).
- **v3** — extension template (WXT).

## Agentic toolchain & dev workflow

Resolved in the `/grill-with-docs` session (2026-06-27). What makes the agent "real agentic" is
that the CLIs it needs are actually present and usable — the buyer never configures tooling.

- **The v1 toolchain is `supabase` + `wrangler`** (the only CLIs the web + money pipeline use).
  Expo + the author's `launch` CLI arrive with the mobile template (v2); Playwright/extension-publish
  with the extension template (v3). No tool is wired before the template that drives it exists.
- **Provisioned globally, OS-aware, by `vybekiit doctor`** — a maintained CLI subcommand (not
  project-local devDeps, not a postinstall). It installs each CLI the right way per OS, is
  idempotent, and verifies the toolchain. The agent (onboarding / `doctor` skills) calls it and
  translates its output. Fixes ship via an npm bump of the CLI — one updatable home.
- **Auth = interactive browser login** (`wrangler login`, `supabase login`), not env tokens. This
  **amends the single-`.env` rule**: `.env` is the source of truth for *runtime* secrets
  (SUPABASE_URL/ANON/SERVICE_ROLE, payment keys), but *CLI/deploy auth* lives in each tool's native
  store. `doctor` therefore verifies auth by **probing** (`wrangler whoami`, a Supabase call), not
  by reading `.env`. The agent hands off the one browser click and waits. See ADR-0001.
- **Database is fully programmatic** — after login the agent runs `supabase projects create`
  (generates the DB password, picks the region from one plain question, polls to healthy, writes the
  keys into `.env`, pushes the schema). Maximum hands-off; `doctor` owns the brittleness (provisioning
  stalls, free-tier/org walls).
- **Dev workflow is trunk-based via tiny squash-PRs.** Direct `git push origin main` is blocked in
  our environment and branch protection needs GitHub Pro/Team, so changes land on a throwaway branch
  → `gh pr merge --squash --delete-branch`. `main` stays the only long-lived branch with linear
  history; CI + the pre-push hook gate every change.

## Localization & RTL

Docs/marketing are **English-only**. The in-product *experience* is auto-localized for free
(agents are multilingual). The **web template is RTL-ready from v1** — CSS logical properties
(`ms-/me-/ps-/pe-/start-/end-`, `rtl:` variants) + end-user locale auto-detect → `dir="rtl"`.
Near-free if done from the first commit, brutal to retrofit. Dev-environment RTL
(VSCode/Cursor/terminal bidi) is **guidance only** in `language.md` — it cannot be shipped as a
plugin; the agent understands Hebrew/Arabic input regardless of how it renders.

## Glossary (domain language)

- **Owned / Maintained** — the two-bucket split every buyer file falls into (see backbone above).
- **The gate** — the private-repo GitHub invite that grants paid access.
- **Tracer bullet** — the v1.0 thin end-to-end slice that proves the whole machine.
- **Decide + Guide** — the agent contract: decide all tech, guide the few manual steps, zero jargon.
- **Verify-before-advance** — every skill tests a step worked before moving on.
- **Agentic toolchain** — the CLIs the agent must have to act (`supabase`, `wrangler`, …),
  provisioned globally by `vybekiit doctor` so the buyer never configures tooling.
- **`vybekiit doctor`** — the maintained CLI subcommand that installs + verifies the toolchain
  (OS-aware, idempotent) and diagnoses a broken project; the human-facing `doctor` *skill* wraps it.

## Open / parked

- **$29 pricing** (parked — revisit before launch).
- Brand name `vybekiit` is **pending availability** (npm `@vybekiit/*`, org, `.com`/`.dev`).
- GTM execution (owned by a friend, not yet engaged).
