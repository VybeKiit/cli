# AGENTS.md — VybeKiit (maintainer layer)

> **Single source of truth** for any agent working on **this monorepo** (building/maintaining the
> kit itself). `CLAUDE.md`, Copilot, Codex, and `.cursor/rules/vybekiit.mdc` (Cursor) are thin
> pointers to this file — keep guidance here, not duplicated, or it drifts. Cursor also loads
> `.cursor/rules/patterns.mdc` as a maintainer pattern summary (not SSOT).
>
> **Audience:** us / our agents (technical voice). This is the **maintainer** layer.
> The **buyer-facing** agent layer (jargon-free, "decide + guide") lives in `templates/*` and is a
> different document with a different voice — do not leak release-engineering jargon into it.
>
> Read `CONTEXT.md` first for the full blueprint, decisions, and domain language.

## What this repo is

A pnpm + Turborepo monorepo that ships a paid starter kit for non-technical builders. Two kinds
of code, governed by the **Owned vs Maintained** split (see `CONTEXT.md`):

- `packages/*` — **MAINTAINED**, headless, `private: true` — **never** published to npm (ADR-0033).
  They ship bundled inside the `vybekiit` CLI (the only public artifact) and are consumed via the
  workspace in the gated monorepo clone. Buyers never edit these. No UI, no framework lock — pure TS.
- `templates/*` — **OWNED**, not published, copied into the buyer's own repo by the CLI. Includes
  all UI and the buyer-facing agent layer. Treated as the buyer's code the moment it's scaffolded.

When you add code, first decide which bucket it belongs to. Logic the buyer shouldn't touch →
`packages/`. Anything they'll customize (UI, screens, copy, their app shell) → `templates/`.

## Stack & tooling

- **Language:** TypeScript, strict. No `any`; narrow in `catch` (`instanceof Error`) before use.
- **Monorepo:** pnpm workspaces + Turborepo. Only the `vybekiit` CLI publishes to npm (MIT, ADR-0033); every `packages/*` is `private: true`.
- **Web/extension UI:** shadcn/ui. **Mobile UI:** plain StyleSheet primitives + `@vybekiit/tokens`.
- **Infra the templates target:** Cloudflare (host/edge/cron/storage/email) + Supabase (db/auth).
- **Payments:** one `@vybekiit/payments` package, one `PaymentProvider` interface, provider
  adapters under `providers/{lemon-squeezy,stripe,paypal}` (official SDKs). Lemon Squeezy is the
  v1 default (Merchant of Record); the agent swaps providers via the `PAYMENTS_PROVIDER` env.

## Conventions

<!-- rules digest — full guide in CODE-STYLE.md; edit there -->

Follow the author's global standards (KISS, YAGNI, ruthless DRY; junior-readable, boring,
traceable code). **Two refactors in flight, sequenced: (1) the publish-surface collapse — now settled
as ADR-0033 (0 published packages; the CLI is the only public artifact, superseding ADR-0025's 5-spine);
(2) the Effect migration (ADR-0023)** — Effect + `Schema` + `Layer`
replace `Result` / zod / factory-wiring end-to-end, one gate-green slice at a time, **in progress not
complete**. The load-bearing rules — **full guide with before/after in [CODE-STYLE.md](./CODE-STYLE.md)**:

- **Nothing under `packages/` is published (ADR-0033).** Every `packages/*` is `private: true` (no
  `publishConfig`); the `vybekiit` CLI is the only public npm package and bundles the `@vybekiit/*`
  it uses (`tsup` `noExternal: [/^@vybekiit\//]`). A new module is either **template-owned code** or a
  **private workspace package** — there is **no public tier** and **no `shared/` tier** (plumbing
  folds into `core`). Buyers get the maintained logic via the gated monorepo clone, never `npm i @vybekiit/*`.
- **Concern-package skeleton (Effect DI, ADR-0023):** `types.ts` (interface + DTOs + tagged `*Error`) ·
  `config.ts` (`Schema.Struct` + Config `Tag`/`Layer`) · `resolve.ts` (service `Tag` + `Live` `Layer`) ·
  `providers/<name>/index.ts` (Effect-returning adapter) · `index.ts` barrel. `core` is the exempt library package.
- **Provider dispatch (ADR-0018, now Effect):** wire each provider as a `Live` `Layer`; the
  `resolveEnvProvider` selector picks the adapter from `*_PROVIDER`. Never `new` a provider at a call
  site, never hand-roll `switch`/`===` on `*_PROVIDER`. Before editing any adapter or `resolve.ts`,
  read `.agents/skills/extend-provider-dispatch/SKILL.md`. Ref: `packages/payments/src/resolve.ts`.
- **One source of truth for config:** per-concern **`Schema.Struct`** in each package's `config.ts`
  (`core` keeps only the `parseEnv` engine); parse only your slice via `parseEnv`, fail loud. **No zod.**
  Root `.env.example` is the SSOT for keys. No scattered URLs/secrets — centralize endpoints in `core`;
  never commit secrets.
- **Errors (ADR-0023):** return `Effect<A, E>` with a `Data.TaggedError` (`code` + `message`) for
  expected failures; `throw` only for programmer/config errors; recover with `Effect.catchTag`. No
  `Result`, no raw `try/catch` across an Effect seam. No bare `console.*` in published packages —
  return an `Effect` (log via `Effect.log*`) or use `createLogger`.
- **DI (ADR-0023):** providers + config are `Context.Tag` services wired by `Layer`; composition roots
  `Effect.provide` them and run at the edge (`runPromiseExit` on servers, one `ManagedRuntime` on clients).
- **Naming:** first-party module **folders and files are camelCase** — everything we author + import by
  path (`providerDispatch.ts`, `useAsync.ts`, `mirrorRepos.mjs`); canonical role files keep fixed names
  (`types.ts`/`config.ts`/`resolve.ts`/`index.ts`). **Kept on framework/ecosystem convention:** UI
  components (`.tsx` + anything under `components/`, `dropdown-menu.tsx`), mirrored registry blocks, Next.js
  reserved files, `*.config.ts`/`*.d.ts`, `.agents/skills/**`, `.py`/`.sh`. **Identity stays kebab:** the
  `@vybekiit/*` name, public subpath exports, config values, route segments (`agentKit` →
  `@vybekiit/agent-kit`; src `localeRules.ts` → public `@vybekiit/i18n/locale-rules`).
- **Regex:** prefer a plain string method when it's as clear (`.replaceAll('x', y)` over `/x/g`); a kept
  regex gets a one-line example comment above it (`input → output` or match/no-match). Full rule in CODE-STYLE.
- **Import aliases (ADR-0026):** templates `@/*` → `./src/*`; packages `@vybekiit/<pkg>/*` everywhere
  (self-imports too). `./` colocated OK; `../` banned. Order: external → `@vybekiit` → `@/` → `./`.
  Domain adapters live in `packages/{seo,email,…}` — not `templates/*/src/vybekiit/`. Full rule in
  CODE-STYLE.
- **Types:** `interface` for contracts, `type` for unions + `Schema.Schema.Type<>`; fields `readonly`;
  `unknown` over `any`; no casts except a vendor-type seam. Named exports only; no `export default` in
  package source (except a Worker handler / `tsup.config.ts`).
- **Docs (changed):** a **one-line** TSDoc on each export — no multi-line "why" essays inline; put
  durable rationale in an ADR / `CONTEXT.md`. Keep files ~200–400 lines; match the nearest sibling;
  reuse helpers before writing new ones.
- **Tests:** colocate `*.test.ts` next to source (not a per-package `test/` dir). Effectful code uses
  `@effect/vitest` (`it.effect` + `Exit`/`Either`). Vitest `3.2.6`, TDD red→green→refactor.
- **Maintainer scripts** are `.mjs` + JSDoc types, `execFile`+`promisify`, secrets scrubbed from logs.

## TDD & quality gate (this is load-bearing — it's also the product promise)

- **Write tests first.** Red → green → refactor. The agent's green loop is the real "no bugs"
  gate and is what makes the buyer's `update-kit` safe (green suite = safe to bump).
- **Pre-commit runs Biome check** (format + lint-fix) on maintainer and buyer templates — it must
  never block on a failing test, so it can be inherited without trapping a non-coder.
- **Pre-push + CI are the heavy gate** — both run `pnpm verify` (lint, typecheck, unit test,
  script tests, build, e2e). A red gate is a check *the agent* fixes before push/merge.
- Run `pnpm verify` after substantial changes (pre-push runs the same commands automatically).
- Never `git push --no-verify` to skip a red gate unless you are deliberately re-running mirror
  sync only — then use the **mirror-repos** workflow or `pnpm mirror` manually.
- Run `./scripts/setup-branch-protection.sh` once if GitHub Team/Pro is available on private repos.

## Authoring buyer-facing content (skills, templates, docs)

Anything that ships to buyers obeys the **Decide + Guide** contract and the strict skill template
(see `CONTEXT.md` → agent layer): one action at a time · **verify-before-advance** · plain
language (per `templates/*/language.md`) · errors translated · celebrate · **no em dashes
(`—`)** in buyer-facing prose (UI titles stay unpunctuated; see Tone in `language.md`). If you
catch yourself writing "env var", "deploy", or "merge conflict" in buyer-facing text, translate it.

## Releasing (the CLI only)

- Semver. **Only the `vybekiit` CLI publishes to npm** (ADR-0033); every `packages/*` is
  `private: true` and ships bundled inside the CLI. `publish.yml` publishes just the CLI.
- Templates + packages are versioned but **not** published — buyers get them via the gated monorepo
  mirror clone; the buyer's `update-kit` pulls the mirror rather than bumping npm deps.
- **Kit releases:** unified `vX.Y.Z` tag on monorepo + all mirrors after each merged PR (unless
  `no-release` label). GitHub Release notes on monorepo only. See ADR-0013 and `release.yml` /
  `publish.yml` (OIDC trusted publishing — no `NPM_TOKEN`).

## Merge policy (maintainer-only)

- **Never** `git push origin main` directly — use throwaway branch → PR → squash merge.
- **Never** `gh pr merge` until `gh pr checks --watch` shows all green (including `verify`).
- Pre-push hook (`.husky/pre-push`) is the local gate; CI is the remote gate.
- Red CI on `main` opens an auto-issue (`ci-failure-issue.yml`) — fix via PR, do not push to main.
- Branch protection: run `./scripts/setup-branch-protection.sh` (needs GitHub Team/Pro on private repos).

## Scripts layout (maintainer vs buyer delivery)

- **`scripts/dev/{mirror,sync,checks,codmods,publish,preview}/`** — maintainer-only tooling grouped by job. Never mirrored or scaffolded to buyers.
- **`scripts/lib/`** — shared imports (`tsupWorkspaceAliases.mjs`, `uiCategoryTaxonomy.mjs`, `repoRoot.mjs`) used by packages and dev scripts.
- **`scripts/data/`** — UI registry manifests, locks, and generated reports (SSOT for `pnpm sync:ui`).
- **`templates/*/scripts/`** — buyer `pnpm verify` surface; each script must be **self-contained** (no monorepo parent paths). Local maintainer scratch may live in `templates/*/scripts/dev/` — gitignored + excluded by the CLI scaffold filter (ADR-0029).
- **`apps/*/scripts/`**, **`infra/scripts/`** — app/infra delivery boundaries unchanged.

## Delivery mirror sync (maintainer-only)

Every push to this monorepo runs **mirror sync automatically** in the pre-push hook, after the
quality gate: `pin-platform-skills` → dirty-tree guard → `pnpm mirror` (all five delivery repos).

- Requires `gh auth login` with write access to `VybeKiit/*` mirrors (uses git credential helper;
  no `GH_MIRROR_TOKEN` needed locally).
- `git push --no-verify` skips mirror sync — re-run via the **mirror-repos** GitHub Actions workflow
  (`workflow_dispatch`, needs `GH_MIRROR_TOKEN` secret) or `pnpm mirror` manually.
- `pnpm mirror --dry-run` to debug subtree splits without force-pushing.
- If `pin-platform-skills` changes tracked files, pre-push aborts — commit the pin results, then push
  again (subtree split publishes committed history only).

## Where to start (build order)

The tracer bullet is **v1.0 = web only + money pipeline first** (see `CONTEXT.md` → Build order).
De-risk the Lemon-Squeezy-checkout → GitHub-invite pipeline before polishing templates: the day
you can take $1 and auto-invite yourself, the business is real.

## Current state (after the v1.0 scaffold)

- **Built + green** (workspace members, in the CI gate): `packages/core`,
  `packages/payments`, `packages/auth`, `packages/db`, `packages/browserAutomation`, `packages/clientState`, `cli`
  (the `vybekiit` scaffolder), and `templates/web` (a real Next.js app, `next build` + `tsc`
  gated in CI). These are real, typed, tested. `templates/web` is still OWNED scaffold payload —
  the CLI copies it verbatim, keeping its `@vybekiit/*` `workspace:*` deps (no npm rewrite; ADR-0033).
- **Two refactors — one settled, one in progress:**
  - **Publish surface (ADR-0033, done):** every `packages/*` is now `private: true`; the `vybekiit`
    CLI is the only public npm artifact and bundles what it needs. This supersedes ADR-0025's 5-spine.
    All **28** packages still physically exist in `packages/` (the by-purpose reorg lands separately),
    but none publishes — do not add `publishConfig` to any of them.
  - **Effect migration (ADR-0023): partial.** The spine (`core`, `payments`, `auth`, `db`,
    `clientState`) is on Effect + `Schema` + tagged errors; `packages/core/src/result.ts` +
    `effectInterop.ts` still exist as the bridge, and templates, tooling, `cli`, and the buyer agent
    layer are **not yet** converted. Slices 5–8 remain. Convert-as-you-touch; `deslop` enforces per-diff.
- **Payload, NOT yet workspace members** (see `pnpm-workspace.yaml`): `templates/{mobile,extension}`
  (v2/v3 placeholders, nothing to build) and `apps/landing`, which today is a stub (webhook + the
  GitHub-invite **gate** only). `apps/landing` joins the workspace alongside its real UI in issue #3,
  so we don't gate an empty shell.
- **The gate lives in `apps/landing`, not in the buyer template.** A buyer's app fulfills its own
  orders (`templates/web/src/lib/fulfillment.ts` → records the order); inviting to our private repo
  is *our* business logic.

## Parked / be aware

- **$29 pricing** is flagged as underpriced (parked, not settled).
- Brand `vybekiit` availability confirmed free on **npm** (`@vybekiit/*` + unscoped) and **GitHub org**
  as of the scaffold; the org still has to be **created in the browser** (no API for that).

## UI mirror + component library

- After `pnpm sync:ui`, rebuild the gallery index: `node scripts/dev/sync/buildComponentLibraryIndex.mjs` (also runs via `apps/componentLibrary` `predev` / `build`).
- Third-party license notes: [docs/THIRD_PARTY_UI_LICENSES.md](./docs/THIRD_PARTY_UI_LICENSES.md).
- Dev UI library: `pnpm dev:ui-library` → `http://localhost:3002`.
- Local dev console: `pnpm dev:local` → `http://localhost:3005` (or `vybekiit local-dev`). A visual sidecar for vibe coders that detects the active agent and animates the agent's workflow steps.
- Gallery previews cache compiled embeds in-session; card hover enables interactive iframes for hover effects without opening the detail page.

<!-- vybekiit:generated:start contract -->
## The contract: Decide + Guide

① **One action at a time** — Do a single step, then stop — never hand the vibe coder a wall of instructions to run at once.
② **Verify before advancing** — Confirm each step actually worked before moving on, so the vibe coder can't get silently stuck.
③ **Plain language** — Translate every technical term using language.md — the vibe coder never has to understand or decide.
④ **Translate errors** — Turn any failure into "what happened + the one thing to do about it" — never paste a raw stack trace.
⑤ **Celebrate progress** — Call out small wins out loud ("Payments are working! 🎉") to keep a non-coder going.
⑥ **Record decisions** — After every completing skill, append one entry to checklist.md Decision log via formatChecklistEntry().
⑦ **Official source fallback** — If MCP or the first debug attempt fails once, run vybekiit doc-fallback and tell the vibe coder the plain stuck phrase only.
⑧ **Fixed = live** — Never say "done" or "fixed" until the change is deployed (if the app is already online). After fixing a bug, ask: "Want me to put this fix online now?" — and verify the live URL reflects the fix before celebrating. The only exception: the vibe coder explicitly said "just fix the code, don't deploy yet."
⑨ **Clarify before removing** — When the vibe coder asks to remove, delete, or hide a visible part of the app, and the request could refer to more than one element, ask one short clarifying question before touching code. Destructive UI changes are not reversible in the builder's eyes.
⑩ **Keep progress visible** — After completing any skill or multi-step task, update checklist.md's Progress section: mark what's done, note what's next. The vibe coder never has to ask "where was I?" — it's always current.
<!-- vybekiit:generated:end contract -->
