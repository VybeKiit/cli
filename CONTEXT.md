# VybeKiit — Context & Blueprint

> The domain map for VybeKiit. Read this first. It captures **what** we're building, the
> **decisions** behind it, and the **language** we use. Implementation details live in code;
> this file is the why and the shape. Authored from a `/grill-me` session on 2026-06-27,
> extended by `/grill-with-docs` sessions the same day (see "Agentic toolchain & dev workflow"
> and the multi-provider widening below).
> **Status: v1.0 scaffold built + green + pushed; templates-first production readiness
> shipped (expanded shadcn kit, dashboard guard, practice checkout, mobile parity,
> extension WXT scaffold). Money pipeline (#4–#8) and CLI publish (#17) remain parked.**

## Template production readiness scorecard (2026-06-29)

| Area | Web | Mobile | Extension |
|---|---|---|---|
| UI kit | 15 shadcn primitives + Sonner + 640 mirrored blocks (8 namespaces) | StyleSheet ports of new primitives | WXT popup: Button, Input, Card, Alert |
| Marketing / auth UX | Normalized hero, legal defaults | Hero + feature cards | Popup + backend URL |
| Signed-in guard | `useUser` dashboard layout | Dashboard redirect | `useUser` + practice sign-in in popup |
| Practice checkout | Local `/checkout/practice` + fulfillment | `billing-client` → web `/api/checkout` | `billing-client` → web `/api/checkout` |
| Tier-1 SaaS UI (B) | Interactive settings, teams, orders, dashboard home, integrations (`src/components/saas/*`) | Interactive settings + dashboard home | Interactive settings screen |
| Long-tail UI (C) | Page recipes install via buyer skills + `pageRecipeInstall` catalog (auth, payments, ops, commerce/CRM orphans) | Shell maps / web-backed | Shell maps / web-backed |
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
| Lives as | private workspace packages in the gated monorepo mirror; bundled into the public CLI when the CLI needs them | files copied into the buyer's scaffolded repo |
| Buyer edits? | never | freely |
| Updates | flow by pulling the gated mirror / kit release line | frozen — never auto-clobbered |
| Examples | `core` (+`/http`), `payments`, `auth`, `db`, `client-state` (private packages, ADR-0033) | `templates/web`, UI components, screens, skills, `tokens`, `report-mode` |

Updates are mirror pulls handled by the agent, not public npm package bumps. The buyer gets the
maintained logic because checkout grants access to the private delivery mirror, not because the
logic is free on npm.

### Template surface language

**Surface recipe**:
A platform-neutral description of a starter app screen or flow.
_Avoid_: React-to-native compiler, UI compiler

**Starter surface**:
A buyer-owned screen or flow generated into a template from a surface recipe.
_Avoid_: Shared screen package, maintained UI screen

**Platform renderer**:
The web, extension, or mobile implementation that turns a surface recipe into template-owned files.
_Avoid_: Cross-platform component compiler

**Surface target**:
An explicit recipe manifest entry for one platform output, such as `web`, `extension.popup`,
`extension.sidepanel`, or `mobile`. Its first-party component source file uses a PascalCase
filename that matches the exported component.
_Avoid_: Inferred filename convention

**Buyer onboarding**:
The agent-guided setup flow that takes a customer from purchased kit to live app.
_Avoid_: App onboarding

**App onboarding**:
The end-user flow after sign-up and before the first dashboard visit.
_Avoid_: Buyer onboarding, walkthrough

**Dashboard walkthrough**:
The end-user tutorial shown after the dashboard is reachable.
_Avoid_: Onboarding

Relationships:

- A **surface recipe** produces one **starter surface** per supported template.
- The page recipe pipeline is the **surface recipe** source of truth: each baseline recipe declares
  the web, extension, and mobile targets it supports, and the recipe check fails when a required
  target is missing source, route, acceptance checks, or install notes.
- A **surface recipe** declares **surface targets** explicitly; target source paths, exports, and
  routes are never inferred from the recipe id or filename.
- A **starter surface** stays **OWNED** after scaffolding; maintained updates flow through new recipes and agent-guided changes, not silent screen replacement.
- A **platform renderer** may reuse maintained primitives, but it does not make buyer-facing screens MAINTAINED.
- **Buyer onboarding**, **app onboarding**, and the **dashboard walkthrough** are separate flows with separate audiences.

## Repo structure

> **Target shape (ADR-0033 — supersedes ADR-0025's five-package spine).** Nothing under `packages/`
> publishes to npm. The module-per-concern *design* is kept, but every package is private workspace
> code and the `vybekiit` CLI is the only public npm artifact. `core` absorbs foundation plumbing;
> the thin long tail folds into templates as OWNED code or stays private tooling. There is **no
> public package tier** and **no `shared/` tier**.

```
vybekiit/                      private monorepo · pnpm + Turborepo
├─ packages/                  headless TS · private workspace packages, never npm-published (ADR-0033)
│  ├─ core/                   MAINTAINED · env+config loader (.env SSOT) + types + utils, AND the
│  │                          absorbed foundation subpaths — @vybekiit/core/http (client·express·next),
│  │                          /observability (createLogger), /security (rate limit, origin lock)
│  ├─ payments/               MAINTAINED · one PaymentProvider · providers/{lemonSqueezy,stripe,paypal}
│  │                          (official SDKs) · LS is the v1 default (MoR) · no UI (ADR-0018)
│  ├─ auth/                   MAINTAINED · one AuthProvider · better-auth bound to the chosen DB;
│  │                          absorbs the Twilio SMS-OTP helper (severs auth → notifications) (ADR-0003)
│  ├─ db/                     MAINTAINED · one DataProvider · providers/{supabase,mongodb,aws} +
│  │                          StorageProvider {supabase/R2,s3} — provider-agnostic (ADR-0002)
│  ├─ clientState/            MAINTAINED · TanStack Query + Zustand/MMKV via resolveClientState() (ADR-0014)
│  ├─ browserAutomation/      PRIVATE tooling · unified Playwright CLI — agent-only, no buyer runtime import
│  ├─ agentKit/               PRIVATE tooling · shared agent-layer source, bundled into the CLI via tsup
│  ├─ uiCatalogMcp/           PRIVATE tooling · UI catalog MCP server (maintainer/agent-only)
│  └─ deploy/                 PRIVATE tooling · Hosting + registrar automation (CLI-only)
├─ templates/                 OWNED · NOT published · cloned from private mirrors (ADR-0005) · frozen.
│  │                          Also home to the folded concerns as OWNED code (kept in sync by
│  │                          check:templates): tokens · reportMode · analytics · seo · cms ·
│  │                          compliance · realtime · i18n · jobs · kv · search · ai · email ·
│  │                          assets · notifications · tenancy
│  ├─ web/                    Next.js + shadcn (RTL-ready) + agent layer               ← v1.0
│  ├─ mobile/                 Expo + StyleSheet primitives + owned design tokens (full web parity)
│  ├─ extension/              WXT + shadcn popup scaffold + agent layer                 ← v3
│  ├─ backend/                Express MVC API for mobile/extension clients
│  └─ spa/                    Vite admin SPA + agent layer
├─ apps/landing/              marketing site — built WITH templates/web (dogfood) · CF Pages ·
│                             ships from the monorepo, NOT a delivery mirror (ADR-0005)
├─ apps/componentLibrary/     public UI gallery (ui.vybekiit.com) — maintainer app, not shipped to buyers
├─ cli/                       npx vybekiit — clones a template mirror into the buyer's repo · itself
│                             a PUBLIC delivery mirror (VybeKiit/cli — no templates/secrets) (ADR-0005)
└─ PROJECT.md AGENTS.md CLAUDE.md CONTEXT.md CODE-STYLE.md LANGUAGE.md   ← MAINTAINER docs (this repo)
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

> The `@vybekiit/*` names below name each **concern's interface**, not a public npm package. Per
> [ADR-0033](./docs/adr/0033-cli-single-published-artifact-and-access-gate.md), only the
> `vybekiit` CLI publishes; packages stay private workspace code and are consumed through the gated
> monorepo mirror / bundled CLI. The interface-per-concern *design* here is unchanged.

| Concern | Choice (default ⭐ · adapters) | Dropped / why |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | — |
| Web UI | shadcn/ui (web + extension share it) | MUI etc. — can't mix design systems; shadcn is best for agents |
| Mobile UI | plain RN `StyleSheet` primitives (Button/Input/Card/Label/Alert) reading shared `@vybekiit/tokens` | NativeWind dropped (too buggy) + react-native-reusables (depends on it); React Native Paper (Material clashes with shadcn) — ADR-0004 |
| Hosting/deploy | `@vybekiit/deploy`: **cloudflare⭐** · vercel · aws (Amplify/SST) · **railway** (coupled stack) | Vercel is opt-in (ADR-0006); Railway is opt-in (ADR-0017); AWS never the default — ADR-0002 |
| Data | `@vybekiit/db` (`DataProvider`): **supabase⭐** (Postgres) · **neon** (serverless Postgres) · **firebase** (Firestore) · **railway** (Railway Postgres) · mongodb (Atlas) · aws (DynamoDB/DocumentDB) | single-stack — kept Supabase batteries as default; Mongo/AWS opt-in — ADR-0002 |
| Auth | `@vybekiit/auth` (`AuthProvider`): **better-auth⭐** bound to the chosen DB (Postgres/Mongo) · Cognito for AWS | "auth = Supabase-only" — new DB adapters have no built-in auth — ADR-0003 |
| Storage | `StorageProvider`: **supabase/R2⭐** · s3 | R2 implemented; doctor provisions on CF stack (ADR-0010) |
| Asset delivery | `@vybekiit/assets`: hybrid build optimize + CDN URLs · derived from hosting+storage | — ADR-0010 |
| Email | `@vybekiit/email` (`EmailProvider`): **cloudflare⭐** · ses · resend | AWS SES now an adapter (was sandbox-approval pain); Resend an adapter (was fallback) |
| Payments | `@vybekiit/payments` (`PaymentProvider`): **lemon-squeezy⭐** · stripe · paypal | LS onboarding via `@vybekiit/browser-automation` `ls`; Stripe and PayPal via MCP; LS is MoR for tax |
| Client state | `@vybekiit/client-state`: TanStack Query + Zustand/MMKV | No Redis for buyers — ADR-0014 |
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

| Term | Meaning |
|------|---------|
| **Quality gate** | `pnpm verify` — lint, typecheck, test, script tests, and build; enforced on maintainer pre-push and CI. |
| **Lenient pre-commit** | Format-only hook; never blocks on failing tests (safe for buyer repos). |

Agent writes **tests-first** (that loop is the real "no bugs" gate, and what makes `update-kit`
safe). Buyer templates ship **Biome** (warn mode for style rules like function length); the agent runs
the **quality smoke** loop (`pnpm verify`) after edits and at onboarding. Buyer repos also ship an
**agent-only pre-push** hook (same `pnpm verify` gate) and **online checker** (GitHub Actions on
ubuntu/macOS/Windows) — the vibe coder never runs `git push`; only the agent does, so these gates
catch problems before code lands without trapping the builder. **Pre-commit stays off** in buyer repos
(lenient local commits). In the **maintainer monorepo**, husky **pre-push** runs the same **quality gate**
and syncs all delivery mirrors — separate from the slimmer buyer hook. TypeScript is **max-strict everywhere**
(`exactOptionalPropertyTypes`, `noImplicitReturns`,
`noUncheckedSideEffectImports` on top of `strict` + `noUncheckedIndexedAccess`); Biome owns
unused-vars / `any` / unreachable so tsconfig doesn't double-own them.

## Distribution, gating & updates

- Packages are **private workspace code** (ADR-0033). The wall is the **private delivery mirror**:
  Lemon Squeezy checkout collects the buyer's GitHub username → webhook → **invite to the gated
  mirror** = the single gate. Refund → access removed. The buyer is **never** invited to the
  maintainer monorepo.
- **Buyer CLI journey (ADR-0038):** `npx vybekiit` / `setup` → full `doctor` (complete toolchain
  catalog, provider-selected install; **detect agents global + per-project → install skills**;
  **wire curated MCPs** for MCP-capable agents) → access gate →
  `create app --web|--mobile|--extension` (kit workspace; app never alone; **assets → optimize +
  CDN + cache + WebP**; **web-perf-ci** discoverable for web/mobile/extension) → agent handoff →
  ongoing **ready pieces** (DB presets, page recipes into the app, backend scaffold/add-*, kit
  update, performance gates). See
  [docs/adr/0038-cli-buyer-journey-and-create-app.md](./docs/adr/0038-cli-buyer-journey-and-create-app.md).
- **Templates reach the buyer via private per-template mirror repos, not the npm CLI** (ADR-0005).
  A **delivery mirror** is one `VybeKiit/<repo>` that a monorepo job force-pushes from a mapped
  source path (one-way subtree split). There are **five**: the three template mirrors
  (`web`/`mobile`/`extension` ← `templates/<name>`, private), `cli` (← root `cli/`, **public** — it
  ships on npm anyway, carries no templates or secrets), and `infra` (← `infra/`, private, **dormant**
  until issue #7 creates its source). **Mirror sync** runs in the maintainer pre-push hook on every
  local push; GitHub Actions `workflow_dispatch` is the manual fallback (ADR-0005).
  `npx vybekiit <name>` clones the matching template mirror with the buyer's `gh` device-flow login
  (so the proprietary OWNED code never ships inside the public npm package — the gate holds). The
  scaffold keeps its `.git`, so `update-kit` pulls the mirror / kit release line instead of bumping
  public `@vybekiit/*` npm packages.
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
    bits, the `.cursor/rules/vybekiit.mdc` redirect + `language.md` tool-vocabulary section.
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
  Playwright/browser-automation with the extension template (v3); the MongoDB Atlas + AWS CLIs only
  when those opt-in adapters are selected. No tool is wired before the template/adapter that drives
  it is in use.
- **Provisioned globally, OS-aware, by `vybekiit doctor`** — a maintained CLI subcommand (not
  project-local devDeps, not a postinstall). It runs a **full** provision + verify pipeline
  (install missing tools, auth probes, presets/registrar/email checks, platform skills, project
  health, R2, report-mode, Codex skills config). The agent (onboarding / `doctor` skills) calls it
  and translates its output. Fixes ship via an npm bump of the CLI — one updatable home. Full
  inventory and pipeline: [ADR-0038 §4](./docs/adr/0038-cli-buyer-journey-and-create-app.md).
- **`doctor` knows the complete tool catalog; installs sparsely.** Always considers agent runtimes
  (`claude`, `codex`, `skills`) + `gh`. Hosting CLI from `HOSTING_PROVIDER` (`wrangler` /
  `vercel` / `railway` / `aws`). Data CLI from `DATA_PROVIDER` (`supabase` / `neonctl` / `atlas`,
  …). Conditionals: AWS for auxiliary providers, `gcloud` for Google sign-in, `eas` + `launch` for
  mobile, native `watchman` / CocoaPods / `docker` by surface. Nothing is installed before the
  adapter or template that drives it is selected — but docs and skills must not describe doctor as
  a partial “gh-only” check.
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
(VSCode/Cursor/terminal bidi) is **guidance only** in `language.md` — it cannot be shipped as a
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
| **Extension (owned)** | `.vybekiit/extensions/skills/*.md` + `extensions/platform-skills/*-vybekiit.md` | Agent-only; buyer-owned | Created by `extend-capabilities-vybekiit` when a skill gap appears |

### Glossary — three “skill” shapes (do not conflate)

| Term | Path | Role | Auto-discovery |
|---|---|---|---|
| **Buyer skill** | `.vybekiit/skills/<goal>.md` | Authoring SSOT — `# Skill:`, `**Goal:**`, `**Contract:**`, `## Steps` | **Fallback** — explicit read via `goal-index.md` when auto-discovery does not match |
| **Agent Skill stub** | `.agents/skills/<goal>/SKILL.md` | **Primary discovery** for buyer goals — generated full duplicate of buyer skill + YAML frontmatter | **Yes** — metadata at startup; implicit invoke from `description` (Cursor, Codex, Claude via symlink) |
| **Platform wrapper** | `.vybekiit/platform-skills/*-vybekiit.md` | Kit wiring the agent reads when a buyer skill or `AGENTS.md` points at it | **No** — explicit read only |
| **Pinned upstream skill** | `.agents/skills/<upstream>/SKILL.md` | Official Expo/Vercel/Firebase skills from [skills.sh](https://skills.sh) | **Yes** — same Agent Skills discovery as stubs |

`vybekiit render-agent-layer` regenerates Agent Skill stubs from buyer skills and creates `.claude/skills` → `.agents/skills` and `.cursor/skills` → `.agents/skills` symlinks (official per-agent paths). `vybekiit doctor` enables Codex `[features] skills = true` in `~/.codex/config.toml`.

**Hybrid distribution:** pin official upstream skills (Expo, Vercel-labs, Supabase, Cloudflare, …) via the
[skills CLI](https://skills.sh) into `.agents/skills/`, plus thin VybeKiit wrappers that wire
`resolve*Provider()`, `TODO(vybekiit)` markers, and verify-before-advance. Shared base manifest at
`packages/agentKit/src/catalogs/platform-skills-base.manifest.json`; each template's
`platform-skills.manifest.json` extends it (mobile adds `expo/skills`). Maintainer CI re-pins via
`scripts/pinPlatformSkills.mjs` after `scripts/dev/checks/auditPlatformSkills.mjs` (strict 90d repo / 180d npm gate).

### Three-channel update (buyer `update-kit`)

| Channel | Mechanism | Buyer hears |
|---|---|---|
| **1 — kit packages / workspace** | Pull gated delivery / kit line after `create app` (ADR-0033/0038; not public `@vybekiit/*` npm bumps) | "latest improvements" |
| **2 — agent layer** | `vybekiit sync-agent-layer` → `AGENT_LAYER_PATHS` allowlist | "refreshing my instructions" |
| **3 — platform skills** | `npx skills update -y` when `skills-lock.json` exists | same sentence — never name Expo/Vercel |

No background daemon — all three run only when the builder says "update the kit". Same journey also
covers **ready pieces** after create (ADR-0038 §7–§8): `apply-preset` / `verify-presets`, page recipe
install into the OWNED app, `scaffold backend` + `backend add-*`, re-running full `doctor` (skills +
MCP + assets validate), automatic **CDN/cache/WebP** for template `public/` assets (ADR-0010), and
**web-perf-ci** speed gates for web/mobile/extension.

### Source-of-truth hierarchy

1. **VybeKiit buyer layer** — `AGENTS.md`, `language.md`, `goal-index.md`, buyer skills
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
| Deploy — Cloudflare ⭐ | [developers.cloudflare.com](https://developers.cloudflare.com) · cloudflare/skills | `deploy-cloudflare-vybekiit.md` | `wrangler`, `workers-best-practices` pinned |
| Deploy — Vercel | [vercel.com/docs](https://vercel.com/docs) | `deploy-vercel-vybekiit.md` | `vercel` CLI via `doctor` when `HOSTING_PROVIDER=vercel` |
| Deploy — Railway | [docs.railway.com](https://docs.railway.com) | `deploy-railway-vybekiit.md` | `railway` CLI + MCP via `doctor` when `HOSTING_PROVIDER=railway` |
| Supabase ⭐ | [supabase.com/docs](https://supabase.com/docs) · supabase/agent-skills | `supabase-vybekiit.md` | `supabase`, `supabase-postgres-best-practices` pinned |
| better-auth ⭐ | [better-auth.com/docs](https://www.better-auth.com/docs) · better-auth/skills | `better-auth-vybekiit.md` | `better-auth-best-practices`, `create-auth-skill`, `better-auth-security-best-practices` pinned |
| Lemon Squeezy ⭐ | [docs.lemonsqueezy.com](https://docs.lemonsqueezy.com) | `lemon-squeezy-vybekiit.md` + `browser-automation-vybekiit.md` (`ls`) | **docs-only** — SDK stale (Nov 2024); no vendor skills repo |
| Stripe (opt-in) | [docs.stripe.com](https://docs.stripe.com) | `stripe-vybekiit.md` | `stripe-best-practices` pinned |
| PayPal (opt-in) | [developer.paypal.com](https://developer.paypal.com) | `paypal-vybekiit.md` | docs-only — agent toolkit + MCP, no skills.sh repo |
| Email — Resend | [resend.com/docs](https://resend.com/docs) · resend/resend-skills | `resend-vybekiit.md` | `resend`, `email-best-practices` pinned |
| Email — SES | [docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses/) | `ses-vybekiit.md` | `EMAIL_PROVIDER=ses` |
| Code hygiene | AGENTS.md conventions | `code-hygiene-vybekiit.md` | invisible — every coding task |
| Observability / logging | `@vybekiit/core` + `@vybekiit/observability` | `observability-vybekiit.md` | `track-errors` skill |
| Sentry (opt-in) | [docs.sentry.io](https://docs.sentry.io/) · getsentry/sentry-for-ai | `sentry-vybekiit.md` | `sentry-sdk-setup`, `sentry-workflow` pinned |
| PostHog (opt-in) | [posthog.com/docs](https://posthog.com/docs) · posthog/ai-plugin | `analytics-vybekiit.md` | `instrument-product-analytics`, `instrument-feature-flags` pinned |
| Plausible (opt-in) | [plausible.io/docs](https://plausible.io/docs) | `analytics-vybekiit.md` | docs-only — no vendor skills repo |
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
| CWS publish | `@vybekiit/browser-automation` (`cws`) + CWS docs | `publish-extension` buyer skill |
| Registrar API keys | Namecheap / GoDaddy dashboards (no OAuth) | `registrar-vybekiit.md` (`nc`, `gd`) | `buy-domain` when NS automation needed |

### Scorecard

| Area | Layer A | Layer B |
|---|---|---|
| Web | 18/18 written | Base manifest pinned (~45 skills): Supabase, Cloudflare, better-auth, Stripe, Resend, Sentry, PostHog + Neon/Firebase/Mongo/AWS/Vercel-labs |
| Mobile | 14/14 written | Base + full expo/skills pinned (~62 skills) |
| Extension | 10/10 written | Base manifest pinned; WXT docs-only |
| Backend | scaffold | Base manifest pinned (~45 skills) |
| Observability | `track-errors` | `@vybekiit/observability` + `@vybekiit/core` logger |
| Deploy | `go-live` + Vercel branch | `@vybekiit/deploy` vercel provider (ADR-0006) |
| Update | Three-channel `update-kit` | `sync-agent-layer` CLI + ADR-0007 |

Install details and wrapper contents live in each template's
`.vybekiit/platform-skills/README.md` and `platform-skills.manifest.json`.

## Language

The full human↔agent glossary — every term, its definition, and the aliases to avoid — lives in
**[LANGUAGE.md](./LANGUAGE.md)**. Names only; edit there. Use its exact terms in code, commits, and
PRs. This file keeps the *shape* and *decisions*; LANGUAGE.md keeps the *names*.

## Open / parked

- **$29 pricing** (parked — revisit before launch).
- Brand name `vybekiit` is **pending availability** (npm `@vybekiit/*`, org, `.com`/`.dev`).
- GTM execution (owned by a friend, not yet engaged).
- **AWS/Mongo adapter maintenance surface** (watch) — each opt-in adapter is real drift + its own
  tests; a vendor SDK change can break an adapter without touching the default. Cost of breadth,
  accepted in ADR-0002.
