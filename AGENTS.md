# AGENTS.md — VybeKiit (maintainer layer)

> **Single source of truth** for any agent working on **this monorepo** (building/maintaining the
> kit itself). `CLAUDE.md`, Copilot, and Codex configs are thin pointers to this file — keep
> guidance here, not duplicated, or it drifts.
>
> **Audience:** us / our agents (technical voice). This is the **maintainer** layer.
> The **buyer-facing** agent layer (jargon-free, "decide + guide") lives in `templates/*` and is a
> different document with a different voice — do not leak release-engineering jargon into it.
>
> Read `CONTEXT.md` first for the full blueprint, decisions, and domain language.

## What this repo is

A pnpm + Turborepo monorepo that ships a paid starter kit for non-technical builders. Two kinds
of code, governed by the **Owned vs Maintained** split (see `CONTEXT.md`):

- `packages/*` — **MAINTAINED**, headless, published to public npm as `@vybekiit/*`. Buyers never
  edit these; updates reach them as version bumps. No UI, no framework lock — pure TS.
- `templates/*` — **OWNED**, not published, copied into the buyer's own repo by the CLI. Includes
  all UI and the buyer-facing agent layer. Treated as the buyer's code the moment it's scaffolded.

When you add code, first decide which bucket it belongs to. Logic the buyer shouldn't touch →
`packages/`. Anything they'll customize (UI, screens, copy, their app shell) → `templates/`.

## Stack & tooling

- **Language:** TypeScript, strict. No `any`; narrow in `catch` (`instanceof Error`) before use.
- **Monorepo:** pnpm workspaces + Turborepo. Packages publish to npm under `@vybekiit/*` (MIT).
- **Web/extension UI:** shadcn/ui. **Mobile UI:** NativeWind + react-native-reusables.
- **Infra the templates target:** Cloudflare (host/edge/cron/storage/email) + Supabase (db/auth).
- **Payments:** swappable packages; `pay-lemonsqueezy` is the v1 default (Merchant of Record).

## Conventions

Follow the author's global standards (KISS, YAGNI, ruthless DRY; junior-readable, boring,
traceable code). Specifically:

- **JSDoc/TSDoc** on every exported function, type/interface, and non-trivial pipeline — document
  *why* and non-obvious constraints, not line-by-line restatement.
- **One source of truth** for config: `packages/core` owns the `.env` loader + typed,
  Zod-validated config. The root `.env.example` is the single source of truth for all keys.
- **No scattered URLs/secrets.** Centralize endpoints in `core`. Never commit secrets.
- Keep files readable (~200–400 lines); split when a file does multiple jobs.
- Match the nearest sibling file's style; reuse existing helpers before writing new ones.

## TDD & quality gate (this is load-bearing — it's also the product promise)

- **Write tests first.** Red → green → refactor. The agent's green loop is the real "no bugs"
  gate and is what makes the buyer's `update-kit` safe (green suite = safe to bump).
- **Pre-commit is lenient** (format + lint-fix only) — it must never block on a failing test, so
  it can be inherited by buyer repos without trapping a non-coder.
- **CI is the heavy gate** (full tests + typecheck). A red CI is a check *the agent* fixes.
- Run the project's typecheck/test/lint after substantial changes.

## Authoring buyer-facing content (skills, templates, docs)

Anything that ships to buyers obeys the **Decide + Guide** contract and the strict skill template
(see `CONTEXT.md` → agent layer): one action at a time · **verify-before-advance** · plain
language (per `templates/*/language.md`) · errors translated · celebrate. If you catch yourself
writing "env var", "deploy", or "merge conflict" in buyer-facing text, translate it.

## Releasing packages

- Semver. Public npm publish under `@vybekiit/*`. Breaking changes to a package = major bump and a
  changelog note; the buyer's `update-kit` skill relies on semver to decide what's safe.
- Templates are versioned but **not** published — they're distributed by the CLI/scaffolder.

## Where to start (build order)

The tracer bullet is **v1.0 = web only + money pipeline first** (see `CONTEXT.md` → Build order).
De-risk the Lemon-Squeezy-checkout → GitHub-invite pipeline before polishing templates: the day
you can take $1 and auto-invite yourself, the business is real.

## Current state (after the v1.0 scaffold)

- **Built + green** (workspace members, in the CI gate): `packages/core`,
  `packages/pay-lemonsqueezy`, `packages/auth`, `packages/db`, and `cli` (the `vybekiit`
  scaffolder). These are real, typed, tested.
- **Payload / build-target** (NOT yet workspace members — see `pnpm-workspace.yaml`):
  `templates/*` and `apps/landing`. `templates/web` is a real Next.js skeleton + the full
  buyer-facing agent layer (`AGENTS.md`, `language.md`, `.vybekiit/skills`), copied verbatim by the
  CLI. `apps/landing` holds the **gate** (GitHub invite/remove) — our store's only addition over
  the template. Both get promoted to built workspace members during the v1.0 web build.
- **The gate lives in `apps/landing`, not in the buyer template.** A buyer's app fulfills its own
  orders (`templates/web/src/lib/fulfillment.ts` → records the order); inviting to our private repo
  is *our* business logic.

## Parked / be aware

- **$29 pricing** is flagged as underpriced (parked, not settled).
- Brand `vybekiit` availability confirmed free on **npm** (`@vybekiit/*` + unscoped) and **GitHub org**
  as of the scaffold; the org still has to be **created in the browser** (no API for that).
