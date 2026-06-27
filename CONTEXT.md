# VybeKiit — Context & Blueprint

> The domain map for VybeKiit. Read this first. It captures **what** we're building, the
> **decisions** behind it, and the **language** we use. Implementation details live in code;
> this file is the why and the shape. Authored from a `/grill-me` session on 2026-06-27,
> extended by `/grill-with-docs` sessions the same day (see "Agentic toolchain & dev workflow"
> and the multi-provider widening below).
> **Status: v1.0 scaffold built + green + pushed; widening to multi-provider adapters + mobile
> parity (grill 2026-06-27); building out the web tracer bullet.**

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
│  ├─ auth/                   one AuthProvider interface · better-auth bound to the chosen DB
│  │                          (Postgres/Mongo) · Cognito for AWS — multi-DB, no UI (ADR-0003)
│  ├─ db/                     one DataProvider interface · providers/{supabase,mongodb,aws} +
│  │                          StorageProvider {supabase/R2,s3} — provider-agnostic (ADR-0002)
│  ├─ deploy/                 NEW · one Hosting interface · providers/{cloudflare,aws} (Amplify/SST)
│  │                          — hosting/deploy behind one contract (ADR-0002)
│  ├─ tokens/                 NEW · shared design tokens (colors/spacing/radius/type) — web consumes
│  │                          as CSS vars, mobile as StyleSheet values (ADR-0004)
│  ├─ extension-publish/      Playwright Chrome-Web-Store automation (publish/submit extensions
│  │                          for the builder) — MAINTAINED so selector-drift fixes ship via npm;
│  │                          the OWNED templates/extension consumes it (v3)
│  ├─ email/                  one EmailProvider interface · providers/{cloudflare,ses,resend}  ← later
│  └─ agent-kit/              shared agent-layer source — the skill contract, language.md core,
│                             goal-index format, update-kit logic (templates embed the rest)  ← Wave A
├─ templates/                 OWNED · NOT published · delivered via private mirrors (ADR-0005) · frozen
│  ├─ web/                    Next.js + shadcn (RTL-ready) + agent layer    ← v1.0
│  ├─ mobile/                 Expo + plain StyleSheet primitives + shared tokens (NativeWind
│  │                          dropped) — full web parity                     ← pulled forward
│  └─ extension/              WXT + shadcn                                    ← v3
├─ apps/landing/              marketing site — built WITH templates/web (dogfood) · CF Pages
├─ cli/                       npx vybekiit — clones a template mirror into the buyer's repo (ADR-0005)
└─ AGENTS.md CLAUDE.md CONTEXT.md   ← MAINTAINER agent layer (this repo, technical voice)
```

Two agent layers, same filenames, different audiences: the **maintainer** layer (repo root,
technical — for us) vs the **buyer** layer (inside `templates/*`, jargon-free — ships to buyers).

Each template ships thin **redirect configs** so any supported agent tool loads the same buyer
`AGENTS.md`: `CLAUDE.md` (Claude Code), `AGENTS.md` itself (Codex, native), and
`.cursor/rules/vybekiit.mdc` (Cursor). Supported tools = **Claude Code · Codex · Cursor**
(Copilot deliberately out of scope). See ADR-0005 and the "Distribution" section.

## Stack decisions

**One interface per concern, swappable adapters, one default ⭐** — the proven `@vybekiit/payments`
shape applied to every concern. Defaults below are unchanged (Supabase + Cloudflare); the other
adapters are opt-in escape hatches the builder never picks (the agent routes via one `.env` setting).
See ADR-0002/0003/0004.

| Concern | Choice (default ⭐ · adapters) | Dropped / why |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | — |
| Web UI | shadcn/ui (web + extension share it) | MUI etc. — can't mix design systems; shadcn is best for agents |
| Mobile UI | plain RN `StyleSheet` primitives (Button/Input/Card/Label/Alert) reading shared `@vybekiit/tokens` | NativeWind dropped (too buggy) + react-native-reusables (depends on it); React Native Paper (Material clashes with shadcn) — ADR-0004 |
| Hosting/deploy | `@vybekiit/deploy`: **cloudflare⭐** · aws (Amplify/SST) | AWS no longer dropped — now an opt-in adapter, never the default — ADR-0002 |
| Data | `@vybekiit/db` (`DataProvider`): **supabase⭐** (Postgres) · mongodb (Atlas) · aws (DynamoDB/DocumentDB) | single-stack — kept Supabase batteries as default; Mongo/AWS opt-in — ADR-0002 |
| Auth | `@vybekiit/auth` (`AuthProvider`): **better-auth⭐** bound to the chosen DB (Postgres/Mongo) · Cognito for AWS | "auth = Supabase-only" — new DB adapters have no built-in auth — ADR-0003 |
| Storage | `StorageProvider`: **supabase/R2⭐** · s3 | — same one-interface pattern (in `@vybekiit/db` or its own pkg) |
| Email | `@vybekiit/email` (`EmailProvider`): **cloudflare⭐** · ses · resend | AWS SES now an adapter (was sandbox-approval pain); Resend an adapter (was fallback) |
| Payments | `@vybekiit/payments` (`PaymentProvider`): **lemon-squeezy⭐** · stripe · paypal | LS is Merchant-of-Record → handles tax/VAT (the scary part) |
| Design tokens | `@vybekiit/tokens`: one shared map (colors/spacing/radius/type) — web as CSS vars, mobile as `StyleSheet` | — DRY look across web + mobile — ADR-0004 |

## The agent layer (the actual product)

- **Contract — "Decide + Guide":** the agent makes *all* technical decisions and never speaks
  jargon. For the few steps only the buyer can do (paste a key, approve a store submission), it
  gives exact, plain-language, one-step-at-a-time instructions. Promise: *you never have to
  understand or decide — just follow simple steps.* (Not "you never see anything technical" —
  that's impossible and breeds refunds.)
- **Docs (single source + pointers):** `AGENTS.md` is the one source of truth; `CLAUDE.md` /
  Copilot / Codex configs are thin redirects. `CONTEXT.md` = domain map. `language.md` =
  voice/jargon glossary ("secret setting" not "env var").
- **Skills are goal-named, never tech-named, and one strict shared template.** Every skill obeys:
  ① one action at a time · ② **verify-before-advance** (test the step worked before continuing —
  this prevents the silent-stuck → refund death) · ③ plain language · ④ errors translated to
  "what happened + the one fix" · ⑤ celebrate progress. Routed via an AGENTS.md goal-index (buyer
  speaks goals, agent picks the skill). A goal-named skill routes to the right adapter underneath —
  "save my data" wires whichever DB the builder uses; the vibe coder never hears "MongoDB" or "AWS".
  - **Tier 1** (agent would botch without these): `onboarding` · `go-live` · `setup-payments` ·
    `update-kit` · `doctor`
  - **Tier 2**: `add-signin` · `save-data` · `add-files` · `buy-domain` · `setup-email`
  - **Not skills** (agent + AGENTS.md handle them): generic coding, design tweaks, CRUD.
  - **Adding a provider never adds a skill — skills are written once against the interface.** A new
    adapter (Mongo, AWS, SES, S3, Cognito) is wiring behind the same goal-named skill, not a new one.
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
  template mirrors**: Lemon Squeezy checkout collects the buyer's GitHub username → webhook →
  **invite to the per-template mirrors** (`web` + `mobile` + `extension`, one bundle) = the single
  gate. Refund → access removed. The buyer is **never** invited to the maintainer monorepo.
- **Templates reach the buyer via private per-template mirror repos, not the npm CLI** (ADR-0005).
  A monorepo CI job mirrors `templates/<name>` → `VybeKiit/<name>` on release (one-way subtree
  split → force-push). `npx vybekiit <name>` clones the matching mirror with the buyer's `gh`
  device-flow login (so the proprietary OWNED code never ships inside the public npm package — the
  gate holds). The scaffold keeps its `.git`, so `update-kit` can `git pull` the mirror in addition
  to npm version bumps for `@vybekiit/*`.
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

> **Widened 2026-06-27 (grill).** v1.0 now also includes the multi-provider data / auth / hosting /
> storage / email adapters (ADR-0002/0003) and pulls the **mobile template forward to full web
> parity** (ADR-0004) — it was deferred to v2. The **defaults** (Supabase + Cloudflare) and the
> tracer-bullet **money pipeline** are unchanged; the new clouds are opt-in escape hatches layered
> on top of the same proven slice.

Build **one thin vertical slice through every layer**, cutting the riskiest unknowns first.

- **v1.0** — WEB only + the **money pipeline** (LS → invite, *de-risk this first*) +
  packages `core` / `payments` / `auth` / `db` + skills `onboarding` / `setup-payments`
  / `go-live` / `doctor` + the dogfooded landing page. Goal: a stranger pays → gets invited →
  scaffolds a web app → wires payments → deploys **live**.
  - **Wave A (pure code, 2026-06-27 grill #2 — no secrets):** the landing page **plus** the delivery
    spine that makes the gate real — mirror-sync CI + populate the `web`/`mobile`/`extension` mirrors,
    CLI clone-from-mirror with `gh` device-flow (ADR-0005), `@vybekiit/agent-kit` for shared agent-layer
    bits, the `.cursor/rules/vybekiit.mdc` redirect + `language.md` tool-vocabulary section.
  - **Wave B (needs the owner's secrets):** the live spine — Supabase → LS→invite money pipeline →
    npm publish → Cloudflare deploy → e2e dry-run.
- **v1.1** — `update-kit`, `setup-auth`, `add-data`, `buy-domain`, `setup-email` (Stripe + PayPal
  adapters already ship in `@vybekiit/payments`).
- **mobile template** (Expo + the author's `launch-store` for deploy) — **pulled into v1.0 at full
  web parity** by the 2026-06-27 grill (was v2; see banner above and ADR-0004).
- **v3** — extension template (WXT).

## Agentic toolchain & dev workflow

Resolved in the `/grill-with-docs` session (2026-06-27). What makes the agent "real agentic" is
that the CLIs it needs are actually present and usable — the buyer never configures tooling.

- **The default toolchain is `supabase` + `wrangler`** (the CLIs the default web + money pipeline
  use). Expo + the author's `launch` CLI arrive with the mobile template (now in v1.0 — see banner);
  Playwright/extension-publish with the extension template (v3); the MongoDB Atlas + AWS CLIs only
  when those opt-in adapters are selected. No tool is wired before the template/adapter that drives
  it is in use.
- **Provisioned globally, OS-aware, by `vybekiit doctor`** — a maintained CLI subcommand (not
  project-local devDeps, not a postinstall). It installs each CLI the right way per OS, is
  idempotent, and verifies the toolchain. The agent (onboarding / `doctor` skills) calls it and
  translates its output. Fixes ship via an npm bump of the CLI — one updatable home.
- **`doctor` provisions per active adapter/template, only when needed.** Same OS-aware, idempotent
  pattern, it also installs/verifies the **MongoDB Atlas CLI** (when the mongodb data adapter is in
  use), the **AWS CLI** (aws data/hosting/storage/email adapters), and the **Expo/EAS CLI** + the
  author's **`launch` CLI** (when the mobile template is in use). Nothing is wired before the adapter
  or template that drives it is selected.
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
- **Provider adapter** — one concrete backend behind a concern's interface (e.g. `mongodb` behind
  `DataProvider`); the proven `@vybekiit/payments` shape — one interface, swappable backends, one
  default ⭐. The builder never picks one; the agent routes via one `.env` setting.
- **DataProvider / AuthProvider / Hosting / StorageProvider / EmailProvider** — the per-concern
  interfaces (data, auth, hosting/deploy, storage, email), each with swappable adapters and one
  default; skills are written once against the interface, so a new adapter never adds a skill.
- **Design tokens (`@vybekiit/tokens`)** — the one shared map of colors/spacing/radius/type that web
  (as CSS vars) and mobile (as `StyleSheet` values) both consume, so the two look consistent.
- **Template mirror** — a private per-template org repo (`VybeKiit/web` etc.) that the CLI clones to
  deliver a template; a derived, force-pushed copy of `templates/<name>`, never hand-edited (ADR-0005).
- **Mirror sync** — the one-way monorepo→mirror CI job (`git subtree split` → force-push on release)
  that keeps each template mirror current; the monorepo is the single source of truth.
- **`@vybekiit/agent-kit`** — the MAINTAINED package holding the *shared* agent-layer source (skill
  contract, `language.md` core, goal-index format, `update-kit` logic); template-specific skills stay
  embedded per template, which is why there is no separate skills repo.
- **Supported agent tools** — Claude Code, Codex, Cursor. Each loads the same buyer `AGENTS.md` via a
  thin redirect (`CLAUDE.md`, native `AGENTS.md`, `.cursor/rules/vybekiit.mdc`); Copilot is out of scope.

## Open / parked

- **$29 pricing** (parked — revisit before launch).
- Brand name `vybekiit` is **pending availability** (npm `@vybekiit/*`, org, `.com`/`.dev`).
- GTM execution (owned by a friend, not yet engaged).
- **AWS/Mongo adapter maintenance surface** (watch) — each opt-in adapter is real drift + its own
  tests; a vendor SDK change can break an adapter without touching the default. Cost of breadth,
  accepted in ADR-0002.
