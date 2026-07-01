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

- `packages/*` — **MAINTAINED**, headless, published to public npm as `@vybekiit/*`. Buyers never
  edit these; updates reach them as version bumps. No UI, no framework lock — pure TS.
- `templates/*` — **OWNED**, not published, copied into the buyer's own repo by the CLI. Includes
  all UI and the buyer-facing agent layer. Treated as the buyer's code the moment it's scaffolded.

When you add code, first decide which bucket it belongs to. Logic the buyer shouldn't touch →
`packages/`. Anything they'll customize (UI, screens, copy, their app shell) → `templates/`.

## Stack & tooling

- **Language:** TypeScript, strict. No `any`; narrow in `catch` (`instanceof Error`) before use.
- **Monorepo:** pnpm workspaces + Turborepo. Packages publish to npm under `@vybekiit/*` (MIT).
- **Web/extension UI:** shadcn/ui. **Mobile UI:** plain StyleSheet primitives + `@vybekiit/tokens`.
- **Infra the templates target:** Cloudflare (host/edge/cron/storage/email) + Supabase (db/auth).
- **Payments:** one `@vybekiit/payments` package, one `PaymentProvider` interface, provider
  adapters under `providers/{lemon-squeezy,stripe,paypal}` (official SDKs). Lemon Squeezy is the
  v1 default (Merchant of Record); the agent swaps providers via the `PAYMENTS_PROVIDER` env.

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
- **Provider dispatch (ADR-0018):** before changing any `*_PROVIDER` adapter or `resolve.ts`, read
  `.agents/skills/extend-provider-dispatch/SKILL.md`. Use `parseEnv` + `resolveEnvProvider` from
  `@vybekiit/core`; never hand-roll `switch` on provider keys or raw `env.*_PROVIDER` compares.
  Reference: `packages/payments/src/resolve.ts`.

## TDD & quality gate (this is load-bearing — it's also the product promise)

- **Write tests first.** Red → green → refactor. The agent's green loop is the real "no bugs"
  gate and is what makes the buyer's `update-kit` safe (green suite = safe to bump).
- **Pre-commit runs Biome check** (format + lint-fix) on maintainer and buyer templates — it must
  never block on a failing test, so it can be inherited without trapping a non-coder.
- **Pre-push + CI are the heavy gate** — both run `pnpm quality` (lint, typecheck, test,
  script tests, build). A red gate is a check *the agent* fixes before push/merge.
- Run `pnpm quality` after substantial changes (pre-push runs the same commands automatically).
- Never `git push --no-verify` to skip a red gate unless you are deliberately re-running mirror
  sync only — then use the **mirror-repos** workflow or `pnpm mirror` manually.
- Run `./scripts/setup-branch-protection.sh` once if GitHub Team/Pro is available on private repos.

## Authoring buyer-facing content (skills, templates, docs)

Anything that ships to buyers obeys the **Decide + Guide** contract and the strict skill template
(see `CONTEXT.md` → agent layer): one action at a time · **verify-before-advance** · plain
language (per `templates/*/language.md`) · errors translated · celebrate · **no em dashes
(`—`)** in buyer-facing prose (UI titles stay unpunctuated; see Tone in `language.md`). If you
catch yourself writing "env var", "deploy", or "merge conflict" in buyer-facing text, translate it.

## Releasing packages

- Semver. Public npm publish under `@vybekiit/*`. Breaking changes to a package = major bump and a
  changelog note; the buyer's `update-kit` skill relies on semver to decide what's safe.
- Templates are versioned but **not** published — they're distributed by the CLI/scaffolder.
- **Kit releases:** unified `vX.Y.Z` tag on monorepo + all mirrors after each merged PR (unless
  `no-release` label). GitHub Release notes on monorepo only. See ADR-0013 and `release.yml` /
  `publish.yml` (OIDC trusted publishing — no `NPM_TOKEN`).

## Merge policy (maintainer-only)

- **Never** `git push origin main` directly — use throwaway branch → PR → squash merge.
- **Never** `gh pr merge` until `gh pr checks --watch` shows all green (including `verify`).
- Pre-push hook (`.husky/pre-push`) is the local gate; CI is the remote gate.
- Red CI on `main` opens an auto-issue (`ci-failure-issue.yml`) — fix via PR, do not push to main.
- Branch protection: run `./scripts/setup-branch-protection.sh` (needs GitHub Team/Pro on private repos).

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
  `packages/payments`, `packages/auth`, `packages/db`, `packages/browser-automation`, `packages/client-state`, `cli`
  (the `vybekiit` scaffolder), and `templates/web` (a real Next.js app, `next build` + `tsc`
  gated in CI). These are real, typed, tested. `templates/web` is still OWNED scaffold payload —
  the CLI copies it verbatim and rewrites its `@vybekiit/*` `workspace:*` deps → npm on scaffold —
  it just no longer ships untyped/unbuilt.
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

<!-- vybekiit:generated:start contract -->
## The contract: Decide + Guide

① **One action at a time** — Do a single step, then stop — never hand the vibe coder a wall of instructions to run at once.
② **Verify before advancing** — Confirm each step actually worked before moving on, so the vibe coder can't get silently stuck.
③ **Plain language** — Translate every technical term using language.md — the vibe coder never has to understand or decide.
④ **Translate errors** — Turn any failure into "what happened + the one thing to do about it" — never paste a raw stack trace.
⑤ **Celebrate progress** — Call out small wins out loud ("Payments are working! 🎉") to keep a non-coder going.
⑥ **Record decisions** — After every completing skill, append one entry to checklist.md Decision log via formatChecklistEntry().
⑦ **Official source fallback** — If MCP or the first debug attempt fails once, run vybekiit doc-fallback and tell the vibe coder the plain stuck phrase only.
<!-- vybekiit:generated:end contract -->
