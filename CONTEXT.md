# VybeKiit — Context & Blueprint

> The domain map for VybeKiit. Read this first. It captures **what** we're building, the
> **decisions** behind it, and the **language** we use. Implementation details live in code;
> this file is the why and the shape. Authored from a `/grill-me` session on 2026-06-27,
> extended by `/grill-with-docs` sessions the same day (see "Agentic toolchain & dev workflow"
> and the multi-provider widening below).
> **Status: v1.0 scaffold built + green + pushed; templates-first production readiness
> shipped (expanded shadcn kit, dashboard guard, practice checkout, mobile parity,
> extension WXT scaffold). Money pipeline (#4–#8) and npm publish (#17) remain parked.**

## Template production readiness scorecard (2026-06-29)

| Area | Web | Mobile | Extension |
|---|---|---|---|
| UI kit | 15 shadcn primitives + Sonner | StyleSheet ports of new primitives | WXT popup: Button, Input, Card, Alert |
| Marketing / auth UX | Normalized hero, legal defaults | Hero + feature cards | Popup + backend URL |
| Signed-in guard | `useUser` dashboard layout | Dashboard redirect | N/A (calls web backend) |
| Practice checkout | Local `/checkout/practice` + fulfillment | `billing-client` → web `/api/checkout` | N/A |
| Quality gate | vitest + Playwright smoke | vitest + typecheck | build + typecheck + vitest |
| Open issues | **#6 closed** (screens) | — | **#20 scaffold shipped** (store publish still skill-driven) |

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
│  ├─ deploy/                 NEW · one Hosting interface · providers/{cloudflare,vercel,aws}
│  │                          — hosting/deploy behind one contract (ADR-0002/0006)
│  ├─ assets/                 NEW · AssetDeliveryProvider — build-time optimize + CDN URLs
│  │                          derived from HOSTING + STORAGE (ADR-0010)
│  ├─ analytics/             visitor stats — Plausible default (ADR-0012)
│  ├─ jobs/                  background jobs — Cloudflare Cron/Queues default
│  ├─ notifications/         push/SMS/email alerts — Expo default
│  ├─ ai/                    runtime LLM — OpenAI default
│  ├─ search/                full-text search — Supabase default
│  ├─ realtime/              live channels — Supabase default
│  ├─ cms/                   MDX content pages
│  ├─ compliance/            cookie consent + export hooks
│  ├─ seo/                   sitemap, robots, metadata
│  ├─ tenancy/               team workspaces — better-auth + db
│  ├─ kv/                    fast KV — Cloudflare default
│  ├─ i18n/                   shared locale + catalog loader
│  ├─ observability/          NEW · one ObservabilityProvider · sentry + local no-op default
│  ├─ tokens/                 NEW · shared design tokens (colors/spacing/radius/type) — web consumes
│  │                          as CSS vars, mobile as StyleSheet values (ADR-0004)
│  ├─ extension-publish/      Playwright Chrome-Web-Store automation (publish/submit extensions
│  │                          for the builder) — MAINTAINED so selector-drift fixes ship via npm;
│  │                          the OWNED templates/extension consumes it (v3)
│  ├─ report-mode/            dev-only Report Mode — structured reports + assistant deeplink handoff
│  ├─ email/                  one EmailProvider interface · providers/{cloudflare,ses,resend}  ← later
│  └─ agent-kit/              shared agent-layer source — the skill contract, BUILDER-VOICE.md core,
│                             goal-index format, update-kit logic (templates embed the rest)  ← Wave A
├─ templates/                 OWNED · NOT published · delivered via private mirrors (ADR-0005) · frozen
│  ├─ web/                    Next.js + shadcn (RTL-ready) + agent layer    ← v1.0
│  ├─ mobile/                 Expo + plain StyleSheet primitives + shared tokens (NativeWind
│  │                          dropped) — full web parity                     ← pulled forward
│  └─ extension/              WXT + shadcn popup scaffold + agent layer       ← v3
├─ apps/landing/              marketing site — built WITH templates/web (dogfood) · CF Pages ·
│                             ships from the monorepo, NOT a delivery mirror (ADR-0005)
├─ cli/                       npx vybekiit — clones a template mirror into the buyer's repo · itself
│                             a PUBLIC delivery mirror (VybeKiit/cli — no templates/secrets) (ADR-0005)
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
| Hosting/deploy | `@vybekiit/deploy`: **cloudflare⭐** · vercel · aws (Amplify/SST) | Vercel is opt-in (ADR-0006); AWS never the default — ADR-0002 |
| Data | `@vybekiit/db` (`DataProvider`): **supabase⭐** (Postgres) · mongodb (Atlas) · aws (DynamoDB/DocumentDB) | single-stack — kept Supabase batteries as default; Mongo/AWS opt-in — ADR-0002 |
| Auth | `@vybekiit/auth` (`AuthProvider`): **better-auth⭐** bound to the chosen DB (Postgres/Mongo) · Cognito for AWS | "auth = Supabase-only" — new DB adapters have no built-in auth — ADR-0003 |
| Storage | `StorageProvider`: **supabase/R2⭐** · s3 | R2 implemented; doctor provisions on CF stack (ADR-0010) |
| Asset delivery | `@vybekiit/assets`: hybrid build optimize + CDN URLs · derived from hosting+storage | — ADR-0010 |
| Email | `@vybekiit/email` (`EmailProvider`): **cloudflare⭐** · ses · resend | AWS SES now an adapter (was sandbox-approval pain); Resend an adapter (was fallback) |
| Payments | `@vybekiit/payments` (`PaymentProvider`): **lemon-squeezy⭐** · stripe · paypal | LS is Merchant-of-Record → handles tax/VAT (the scary part) |
| Design tokens | `@vybekiit/tokens`: one shared map (colors/spacing/radius/type) — web as CSS vars, mobile as `StyleSheet` | — DRY look across web + mobile — ADR-0004 |
| Observability | `@vybekiit/observability` (`ObservabilityProvider`): **local⭐** (no-op) · sentry | `@vybekiit/core` `createLogger` — dev verbose, production silent |
| Web UI blocks | shadcn/ui + shadcn-compatible registries (Magic UI, Kokonut, 21st.dev, …) | Agent picks from `.vybekiit/agent/ui-sources.md`; normalize to kit primitives |

## The agent layer (the actual product)

- **Contract — "Decide + Guide":** the agent makes *all* technical decisions and never speaks
  jargon. For the few steps only the buyer can do (paste a key, approve a store submission), it
  gives exact, plain-language, one-step-at-a-time instructions. Promise: *you never have to
  understand or decide — just follow simple steps.* (Not "you never see anything technical" —
  that's impossible and breeds refunds.)
- **Docs (single source + pointers):** `AGENTS.md` is the one source of truth; `CLAUDE.md` /
  Copilot / Codex configs are thin redirects. `CONTEXT.md` = domain map. `BUILDER-VOICE.md` =
  voice/jargon glossary ("secret setting" not "env var").
- **Skills are goal-named, never tech-named, and one strict shared template.** Every skill obeys:
  ① one action at a time · ② **verify-before-advance** (test the step worked before continuing —
  this prevents the silent-stuck → refund death) · ③ plain language · ④ errors translated to
  "what happened + the one fix" · ⑤ celebrate progress. Routed via an AGENTS.md goal-index (buyer
  speaks goals, agent picks the skill). A goal-named skill routes to the right adapter underneath —
  "save my data" wires whichever DB the builder uses; the vibe coder never hears "MongoDB" or "AWS".
  - **Tier 1** (agent would botch without these): `onboarding` · `go-live` · `setup-payments` ·
    `update-kit` · `doctor`
  - **Tier 2**: `add-signin` · `save-data` · `add-files` · `add-images` · `buy-domain` · `setup-email`
  - **Not skills** (agent + AGENTS.md handle them): generic coding, design tweaks, CRUD — guarded
    invisibly by **code hygiene guardrails** (DRY, check-before-create, kit logger, UI consistency).
  - **Adding a provider never adds a skill — skills are written once against the interface.** A new
    adapter (Mongo, AWS, SES, S3, Cognito, Sentry) is wiring behind the same goal-named skill, not a new one.
- **AI agent anti-patterns (prevented invisibly):** duplicate helpers, bare `console.log` in production,
  phantom validation, mismatched UI from random block libraries, no SSOT for lib files, untested features,
  hand-rolled fetch state. Layer B skills (`code-hygiene-vybekiit`, `observability-vybekiit`,
  `ui-consistency-vybekiit`, `testing-vybekiit`, `format-lint-vybekiit`, `react-patterns-vybekiit`,
  `responsive-vybekiit`) + `check-safety` / `go-live` ship gates enforce these — the builder never hears the jargon.
- **Keystone:** `onboarding` ends with the buyer's app **LIVE** in session #1. That "aha" kills
  refund-regret and is also the marketing demo.

## Quality

Agent writes **tests-first** (that loop is the real "no bugs" gate, and what makes `update-kit`
safe). Buyer templates ship **Biome** (warn mode for style rules like function length); the agent runs
the **quality smoke** loop (`pnpm quality`) after edits and at onboarding. Buyer repos also ship an
**agent-only pre-push** hook (same `pnpm quality` gate) and **online checker** (GitHub Actions on
ubuntu/macOS/Windows) — the vibe coder never runs `git push`; only the agent does, so these gates
catch problems before code lands without trapping the builder. **Pre-commit stays off** in buyer repos
(lenient local commits). In the **maintainer monorepo**, husky **pre-push** mirrors the full monorepo
gate (lint → typecheck → test → build) and syncs all delivery mirrors — separate from the slimmer
buyer hook. TypeScript is **max-strict everywhere**
(`exactOptionalPropertyTypes`, `noImplicitReturns`,
`noUncheckedSideEffectImports` on top of `strict` + `noUncheckedIndexedAccess`); Biome owns
unused-vars / `any` / unreachable so tsconfig doesn't double-own them.

## Distribution, gating & updates

- Packages are **public** (free updates via npm, double as marketing). The wall is the **private
  template mirrors**: Lemon Squeezy checkout collects the buyer's GitHub username → webhook →
  **invite to the per-template mirrors** (`web` + `mobile` + `extension`, one bundle) = the single
  gate. Refund → access removed. The buyer is **never** invited to the maintainer monorepo.
- **Templates reach the buyer via private per-template mirror repos, not the npm CLI** (ADR-0005).
  A **delivery mirror** is one `VybeKiit/<repo>` that a monorepo job force-pushes from a mapped
  source path (one-way subtree split). There are **five**: the three template mirrors
  (`web`/`mobile`/`extension` ← `templates/<name>`, private), `cli` (← root `cli/`, **public** — it
  ships on npm anyway, carries no templates or secrets), and `infra` (← `infra/`, private, **dormant**
  until issue #7 creates its source). **Mirror sync** runs in the maintainer pre-push hook on every
  local push; GitHub Actions `workflow_dispatch` is the manual fallback (ADR-0005).
  `npx vybekiit <name>` clones the matching template mirror with the buyer's `gh` device-flow login
  (so the proprietary OWNED code never ships inside the public npm package — the gate holds). The
  scaffold keeps its `.git`, so `update-kit` can `git pull` the mirror in addition to npm version
  bumps for `@vybekiit/*`.
- **The landing site is not a mirror.** `apps/landing` is the store; it ships from the monorepo via
  its own deploy (issue #7), not through a delivery mirror — it is never scaffolded into a buyer repo.
- **The "skills-bag" is not a mirror either.** Official upstream platform skills are *pinned into* the
  templates before sync (`pin-platform-skills.mjs` + `platform-skills.manifest.json`, ADR-0007); they
  ride the template mirrors, not a separate delivery repo.
- **Security is secure-by-default** (ADR-0009): `@vybekiit/security` + tiered rate limits in `.env`;
  agent skills `harden` and `check-safety` confirm coverage before ship.
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
    bits, the `.cursor/rules/vybekiit.mdc` redirect + `BUILDER-VOICE.md` tool-vocabulary section.
  - **Wave B (needs the owner's secrets):** the live spine — Supabase → LS→invite money pipeline →
    npm publish → Cloudflare deploy → e2e dry-run.
- **v1.1** — shipped early as Tier 2 in v1.0 widening: `update-kit`, `add-signin`, `save-data`,
  `buy-domain`, `setup-email` (Stripe + PayPal adapters already ship in `@vybekiit/payments`).
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

Docs/marketing are **English-only**. The in-product *experience* uses **structured i18n from day
one** — every user-facing string lives in a **message catalog** (flat-dotted keys → strings), not
inline in JSX.

- **Message catalog** — JSON file of keys → strings; sole source of user-facing copy.
- **Locale** — language tag (e.g. `en`, `he`); drives both translations and RTL layout.
- **Default locale** — `en` shipped in every template; other locales added via the `add-language`
  buyer skill.
- **Auto-localized** — agents add locales by duplicating the catalog and filling translations in
  one shot (not by writing copy inline in components).

Platform-native stacks: **next-intl** (web), **expo-localization + i18n-js** (mobile), **Chrome
`_locales/`** (extension). RTL is derived from the **active locale** — CSS logical properties
(`ms-/me-/ps-/pe-/start-/end-`, `rtl:` variants) on web/extension; `I18nManager` on mobile.
Near-free if done from the first commit, brutal to retrofit. Dev-environment RTL
(VSCode/Cursor/terminal bidi) is **guidance only** in `BUILDER-VOICE.md` — it cannot be shipped as a
plugin; the agent understands Hebrew/Arabic input regardless of how it renders.

## Skills inventory & source of truth

> Authored from a `/grill-me` session on 2026-06-27. Two layers: **buyer goal skills** (what the
> vibe coder asks for) and **platform execution skills** (what the agent needs behind the scenes).
> Buyer never sees Layer B names.

### Two-layer model

| Layer | Lives at | Audience | Naming |
|---|---|---|---|
| **A — Buyer goals** | `templates/*/`.vybekiit/skills/*.md` | Vibe coder (via agent) | Goal-named (`go-live`, not `deploy-to-cloudflare`) |
| **B — Platform execution** | `.vybekiit/platform-skills/*.md` + pinned official `SKILL.md` | Agent only | Tech-named; references official docs/skills |

**Hybrid distribution:** pin official upstream skills (Expo, Vercel-labs, Cloudflare) via the
[skills CLI](https://skills.sh) into `.agents/skills/`, plus thin VybeKiit wrappers that wire
`resolve*Provider()`, `TODO(vybekiit)` markers, and verify-before-advance. Maintainer CI re-pins
via `scripts/pin-platform-skills.mjs` + `platform-skills.manifest.json` before mirror sync (ADR-0007).

### Three-channel update (buyer `update-kit`)

| Channel | Mechanism | Buyer hears |
|---|---|---|
| **1 — npm** | `planKitUpdate()` → bump `@vybekiit/*` | "latest improvements" |
| **2 — agent layer** | `vybekiit sync-agent-layer` → `AGENT_LAYER_PATHS` allowlist | "refreshing my instructions" |
| **3 — platform skills** | `npx skills update -y` when `skills-lock.json` exists | same sentence — never name Expo/Vercel |

No background daemon — all three run only when the builder says "update the kit".

### Source-of-truth hierarchy

1. **VybeKiit buyer layer** — `AGENTS.md`, `BUILDER-VOICE.md`, `goal-index.md`, buyer skills
2. **`@vybekiit/*` packages** — TypeScript interfaces + package READMEs
3. **Official platform docs** — always win on API facts
4. **Official platform skills** — preferred over custom when they exist (expo/skills, vercel-labs)
5. **VybeKiit wrapper skills** — kit-specific wiring Layer A cannot express

### Layer A — buyer goal skills

Path: `templates/{web,mobile,extension}/.vybekiit/skills/<goal>.md`

| Template | Written | Missing / notes |
|---|---|---|
| **Web** | 19/19 (+ `plan-my-idea`, `harden`, `check-safety`, `sign-in-with-google`, `track-errors`, `back-up-my-code`) | `go-live` pre-flight runs code/UI + quality checks; `track-errors` wires Sentry |
| **Mobile** | 15/15 (+ `plan-my-idea`, `check-safety`, `track-errors`, `sign-in-with-google`, `back-up-my-code`) | UI ports from web catalog only (ADR-0004); backend safety via web |
| **Extension (v3)** | 11/11 (+ `plan-my-idea`, tier-2 defer-to-backend variants) | WXT scaffold v3; shares web UI catalog when scaffold ships |

**Not skills** (agent + `AGENTS.md`): generic coding, design tweaks, CRUD — unless a goal skill above
matches.

### Layer B — platform execution skills

#### Web / Next.js

| Concern | Official upstream | VybeKiit wrapper | Pin command (from template root) |
|---|---|---|---|
| Next.js App Router | [nextjs.org/docs](https://nextjs.org/docs) · vercel-labs | `nextjs-vybekiit.md` | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices --skill vercel-composition-patterns -y` |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) | `shadcn-vybekiit.md` | shadcn MCP at edit time |
| Deploy — Cloudflare ⭐ | [developers.cloudflare.com](https://developers.cloudflare.com) | `deploy-cloudflare-vybekiit.md` | Cloudflare plugin skills or global install |
| Deploy — Vercel | [vercel.com/docs](https://vercel.com/docs) | `deploy-vercel-vybekiit.md` | `vercel` CLI via `doctor` when `HOSTING_PROVIDER=vercel` |
| Supabase ⭐ | [supabase.com/docs](https://supabase.com/docs) | `supabase-vybekiit.md` | `supabase` CLI via `doctor` |
| better-auth ⭐ | [better-auth.com/docs](https://www.better-auth.com/docs) | `better-auth-vybekiit.md` | — |
| Lemon Squeezy ⭐ | [docs.lemonsqueezy.com](https://docs.lemonsqueezy.com) | `lemon-squeezy-vybekiit.md` | — |
| Stripe (opt-in) | [docs.stripe.com](https://docs.stripe.com) | `stripe-vybekiit.md` | `PAYMENTS_PROVIDER=stripe` |
| PayPal (opt-in) | [developer.paypal.com](https://developer.paypal.com) | `paypal-vybekiit.md` | `PAYMENTS_PROVIDER=paypal` |
| Email — Resend | [resend.com/docs](https://resend.com/docs) | `resend-vybekiit.md` | `EMAIL_PROVIDER=resend` |
| Email — SES | [docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses/) | `ses-vybekiit.md` | `EMAIL_PROVIDER=ses` |
| Code hygiene | AGENTS.md conventions | `code-hygiene-vybekiit.md` | invisible — every coding task |
| Observability / logging | `@vybekiit/core` + `@vybekiit/observability` | `observability-vybekiit.md` | `track-errors` skill |
| Sentry (opt-in) | [docs.sentry.io](https://docs.sentry.io/) | `sentry-vybekiit.md` | `OBSERVABILITY_PROVIDER=sentry` |
| UI consistency | `.vybekiit/agent/ui-sources.md` | `ui-consistency-vybekiit.md` | shadcn ecosystem catalog |
| Testing | vitest + Testing Library | `testing-vybekiit.md` | invisible — every coding task |
| Format + lint | Biome in template | `format-lint-vybekiit.md` | `pnpm format` / `pnpm lint` |
| React patterns | kit hooks + FormField | `react-patterns-vybekiit.md` | `src/hooks/README.md` |
| Responsive (web) | mobile-first Tailwind | `responsive-vybekiit.md` | preview at 375px |
| GitHub backup | `gh` CLI | `github-vybekiit.md` | `back-up-my-code` skill |

#### Mobile / Expo

| Concern | Official upstream | VybeKiit wrapper | Pin command |
|---|---|---|---|
| Full Expo stack | [docs.expo.dev/skills](https://docs.expo.dev/skills/) · [expo/skills](https://github.com/expo/skills) | per-skill wrappers as needed | `npx skills add expo/skills --skill '*' -y` |
| Store publish | `launch-store` npm CLI | `launch-store-vybekiit.md` | `doctor` installs `launch` when mobile |

#### Extension / Chrome (v3)

| Concern | Official upstream | VybeKiit wrapper |
|---|---|---|
| WXT | [wxt.dev](https://wxt.dev) | docs-only in wrapper (no custom WXT skill yet) |
| Chrome Extension APIs | [developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions) | `chrome-extension-vybekiit.md` |
| CWS publish | `@vybekiit/extension-publish` + CWS docs | invoked by `publish-extension` buyer skill |

### Scorecard

| Area | Layer A | Layer B |
|---|---|---|
| Web | 18/18 written | Wrappers + hygiene/observability/ui-consistency/sentry + SDLC (testing, format-lint, react-patterns, responsive, github); Vercel-labs pinned |
| Mobile | 14/14 written | Full expo/skills pinned; hygiene/observability/ui + SDLC wrappers copied |
| Extension | 10/10 written | Chrome API wrapper; UI catalog docs; scaffold v3 |
| Observability | `track-errors` | `@vybekiit/observability` + `@vybekiit/core` logger |
| Deploy | `go-live` + Vercel branch | `@vybekiit/deploy` vercel provider (ADR-0006) |
| Update | Three-channel `update-kit` | `sync-agent-layer` CLI + ADR-0007 |

Install details and wrapper contents live in each template's
`.vybekiit/platform-skills/README.md` and `platform-skills.manifest.json`.

## Language

**Owned**:
App shell, all UI, and the buyer agent layer — files copied into the buyer's scaffolded repo. The
buyer edits freely; updates are frozen and never auto-clobbered. Examples: web/mobile/extension
templates, UI components, screens, buyer skills.
_Avoid_: maintained (see **Maintained**).

**Maintained**:
Headless logic shipped as public npm packages. The buyer never edits these directly; updates flow as
version bumps (conflict-free). Examples: core config, payments, auth, email, db, observability, agent-kit.
_Avoid_: owned (see **Owned**).

**Agent layer**:
The skills, docs, and contracts that let Claude/Codex carry a vibe coder from purchase to a live,
money-making app — making every technical decision for them and translating manual steps into plain
language. Two layers, same filenames, different audiences: the **maintainer** layer (repo root,
technical voice) vs the **buyer** layer (inside templates, jargon-free, ships to buyers).

**Buyer layer**:
The agent-facing docs and skills inside each template — goal-named skills, `AGENTS.md`, and
`BUILDER-VOICE.md` for plain-language rules. Never speaks jargon to the builder.

**Goal-named skill**:
A buyer skill named for what the builder wants ("go live", "save my data"), never for the tech
("deploy to Cloudflare", "set up MongoDB"). Routes to the right adapter underneath; the builder
never hears backend names. Adding a provider never adds a skill — skills are written once against
the interface.
_Avoid_: tech-named skill, platform skill (Layer B names are agent-only).

**Decide + Guide**:
The agent contract — make all technical decisions, guide the few steps only the buyer can do (paste a
key, approve a store submission) in exact plain-language one-step-at-a-time instructions. Promise:
you never have to understand or decide; just follow simple steps.
_Avoid_: "you never see anything technical" (impossible and breeds refunds).

**Verify-before-advance**:
Every skill tests that a step worked before continuing. Prevents the silent-stuck → refund death
spiral.

**Report Mode**:
Dev-only overlay on the localhost preview (web, mobile, extension). The builder toggles inspect
mode (Option+Shift+R on web/extension; **R** FAB on mobile), clicks or taps what looks wrong, types
a one-line note, and the kit fires a native assistant deeplink with structured context. Never ships
in production builds. In buyer voice: "point at what's wrong" — never "Report Mode" unless they ask
about the hotkey.
_Avoid_: exposing deeplinks, URI schemes, or DOM selectors to the builder.

**Vibe coder report**:
The structured handoff payload (route, element selector or tap coordinates, console errors, builder
note) prefixed with `[VybeKiit Report]`. Agent-internal — the builder never sees this term; `doctor`
reads it and skips the reproduce question.
_Avoid_: asking the builder to craft a prompt when Report Mode already captured context.

**SEO**:
Discoverability metadata — titles, descriptions, sitemaps, Open Graph — so search engines find the
buyer's app. Wired via `@vybekiit/seo` and buyer skills; agent-handled. In buyer voice: "how
search engines find you".
_Avoid_: saying "SEO" to the builder.

**Adapter**:
One concrete backend behind a concern's interface — the proven payments shape applied everywhere:
one interface, swappable backends, one default. The builder never picks one; the agent routes via
one secret setting.
_Avoid_: provider (in buyer voice — say "the service your app uses" not "the MongoDB adapter").

**Local dev adapter**:
The zero-config, in-memory `local` adapter for `@vybekiit/db` and `@vybekiit/auth` that resolves
**only when no backend is configured**, so a freshly scaffolded app runs on the first `pnpm dev`
(fake dev user, session-scoped data) — making the **keystone** (live in session #1) real before any
account exists. An explicit provider always wins; data resets on restart by design (ADR-0008). In
buyer voice it is "practice data" / "a starter sign-in", never "the local adapter".
_Avoid_: calling it a backend the buyer chooses (it is an invisible fallback, swapped out by
[[add-signin]] / [[save-data]]).

**Provider interface**:
The per-concern contract (data, auth, hosting/deploy, storage, email, payments) with swappable
adapters and one default. Skills are written once against the interface, so a new adapter never adds
a skill.

**Design tokens**:
The one shared map of colors, spacing, radius, and type that web (as CSS vars) and mobile (as
StyleSheet values) both consume, so the two platforms look consistent.

**GEO / answer-engine optimization**:
Structured metadata so AI answer engines (ChatGPT, Perplexity, Claude, Google AI Mode) can discover
and cite the buyer's app — JSON-LD (FAQ, Article), `/llms.txt`, Open Graph, and hub-spoke internal
links. Wired via `@vybekiit/seo` and buyer skills (`add-blog`, `go-live`); not a separate package or
buyer choice.
_Avoid_: exposing "GEO" or "AEO" jargon to the builder — say "so AI search can find your site".

**Code hygiene guardrails**:
Invisible agent rules (AGENTS.md + Layer B) that prevent AI coding anti-patterns — check-before-create,
one lib file per concern, kit logger instead of `console.log`, zod at API boundaries. Enforced at
`check-safety` / `go-live` without a buyer-facing skill.

**SDLC guardrails**:
The invisible agent quality loop — tests with every feature, Biome format/lint after edits, kit hooks
and React patterns, mobile-first web layout. Layer B skills (`testing-vybekiit`, `format-lint-vybekiit`,
`react-patterns-vybekiit`, `responsive-vybekiit`) plus `pnpm quality` at onboarding and ship checks.
The builder never runs vitest or the linter.

**Quality smoke**:
Agent-run `pnpm quality` (format → lint → typecheck → test) after first install and before calling
work done or shipping. Failures are fixed by the agent; Biome style warnings are soft.

**Mobile-first** (web):
Default layouts for narrow/phone width first, then scale up with `md:`/`lg:` breakpoints. Preview at
375px before telling the builder a page is done.

**Agent push gate**:
Husky **pre-push** in buyer templates — runs `pnpm quality` (and optional UI walkthrough tests) when
the **agent** pushes. The builder never hits it; it stops bad code before it reaches the remote.

**Online checker**:
Buyer `.github/workflows/ci.yml` — the automatic checker on ubuntu/macOS/Windows. Builder hears
*"the automatic checker online"*, never CI/CD or GitHub Actions.

**Utility registry**:
`src/lib/README.md` in each template — the agent-only map of which file owns auth, billing, logging,
etc. Read before adding helpers.

**Production-silent logging**:
`@vybekiit/core` `createLogger` — verbose in development, quiet in production automatically via
`NODE_ENV`; optional `LOG_LEVEL` override for agents only.

**UI source catalog**:
Agent-only list of approved shadcn-compatible block libraries (Magic UI, Kokonut, 21st.dev, …) in
`.vybekiit/agent/ui-sources.md`. The builder never picks; the agent normalizes every import.

**Normalize-on-import**:
When copying a third-party UI block, swap to kit `Button`/`Input`, map colors to `@vybekiit/tokens`,
and strip custom sizes before shipping.

**Primitive-first**:
Use `src/components/ui/*` for standard controls — never raw `<button>` / one-off styled inputs.

**Agent-kit**:
The maintained package holding the shared agent-layer source — skill contract, BUILDER-VOICE.md
core, goal-index format, update-kit logic, ui-sources catalog. Template-specific skills stay embedded per template.

**The gate**:
The private-repo GitHub invite that grants paid access after Lemon Squeezy checkout collects the
buyer's username. Refund → access removed. The buyer is never invited to the maintainer monorepo.

**Template mirror**:
A private per-template org repo the CLI clones to deliver a template — a derived, force-pushed copy
of the template folder, never hand-edited (ADR-0005).

**Mirror sync**:
Maintainer pre-push hook that force-pushes all delivery mirrors after the local quality gate;
GitHub Actions `workflow_dispatch` is the manual fallback. The monorepo is the single source of truth.

**Tracer bullet**:
The v1.0 thin end-to-end slice through every layer that proves the whole machine — a stranger pays,
gets invited, scaffolds a web app, wires payments, deploys live.

**Project asset**:
A file in the repo the builder ships with the app (`public/`, `assets/`, extension icons) —
optimized automatically at build time.

**User upload**:
A file a user adds at runtime (avatar, attachment) — stored via `StorageProvider` and served through
CDN transform URLs, not raw bucket links.

**Asset delivery**:
The kit's automatic optimize + CDN layer (`@vybekiit/assets`). The builder never picks a CDN;
it follows hosting + storage settings (ADR-0010).

**Background job**:
Work the app runs later or on a schedule (cleanup, reminders) — `@vybekiit/jobs`; buyer skill: go-live
checks bindings; agent wires cron/queue.

**Visitor stats**:
Plain-language analytics — `@vybekiit/analytics`; buyer skill: `add-analytics`.

**Push notification**:
Alert on phone — `@vybekiit/notifications` (Expo default); buyer skill: `add-notifications`.

**AI feature**:
Server-side smart replies or helpers — `@vybekiit/ai`; buyer skill: `add-ai` (not pre-built demo apps).

**Search index**:
Find-in-app data — `@vybekiit/search`; buyer skill: `add-search`.

**Live update**:
Real-time channels — `@vybekiit/realtime` (Supabase default).

**Blog page**:
Content from repo files — `@vybekiit/cms` + `@vybekiit/seo`; buyer skill: `add-blog`.

**Cookie consent**:
Banner + export hooks — `@vybekiit/compliance`.

**Team workspace**:
Orgs and invites — `@vybekiit/tenancy`; buyer skill: `add-teams`.

**Fast storage**:
KV cache — `@vybekiit/kv` (Cloudflare default).

**Message catalog loader**:
Shared locale + RTL — `@vybekiit/i18n` with template JSON catalogs.

**Agentic toolchain**:
The CLIs the agent must have to act (supabase, wrangler, Expo/EAS, etc.), provisioned globally by
`vybekiit doctor` so the buyer never configures tooling. Nothing is wired before the template or
adapter that drives it is selected.

**Doctor**:
The maintained CLI subcommand that installs and verifies the toolchain (OS-aware, idempotent) and
diagnoses a broken project. The human-facing doctor *skill* wraps it for the buyer.

**Platform skill**:
Layer B execution knowledge — official upstream docs/skills plus thin VybeKiit wrappers that wire
provider resolution and verify-before-advance. Never shown to the builder.
_Avoid_: goal-named skill (Layer A is what the buyer asks for).

**Supported agent tools**:
Claude Code, Codex, Cursor. Each loads the same buyer `AGENTS.md` via a thin redirect; Copilot is
out of scope.

## Open / parked

- **$29 pricing** (parked — revisit before launch).
- Brand name `vybekiit` is **pending availability** (npm `@vybekiit/*`, org, `.com`/`.dev`).
- GTM execution (owned by a friend, not yet engaged).
- **AWS/Mongo adapter maintenance surface** (watch) — each opt-in adapter is real drift + its own
  tests; a vendor SDK change can break an adapter without touching the default. Cost of breadth,
  accepted in ADR-0002.
