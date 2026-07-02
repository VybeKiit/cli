# ADR-0022: Package publish-surface collapse

**Status:** Superseded on the publish axis by **ADR-0025** (refines ADR-0012)
**Date:** 2026-07-01

> **Superseded (2026-07-02) by [ADR-0025](./0025-publish-surface-collapse-to-five.md).** The collapse
> is retained, but the target is **5** published (not 6 — `tokens` becomes template-owned) and the
> **`shared/` tier is dropped**: `observability`/`security` fold into `core` alongside `http`, and
> `report-mode`/`analytics`/`tokens` become template-owned. Read ADR-0025 for the current shape; this
> ADR's adapter-behind-one-interface design and bucket-decision rule still stand.

## Context

ADR-0012 widened the maintained surface to ~21 (now **28**) `@vybekiit/*` packages, one per
concern, each published to public npm. Measured against reality, most of that surface does not earn
a *published* slot:

- A long tail of **13 concerns** (`seo` `cms` `compliance` `realtime` `i18n` `jobs` `kv` `search`
  `ai` `email` `assets` `notifications`) are 45–442 LOC, `local`-only or single-adapter stubs with
  **one** downstream consumer. `email` has **zero** consumers anywhere — fully unwired.
- Four concerns (`browser-automation` 6846 LOC, `agent-kit`, `ui-catalog-mcp`, `deploy`) are
  **agent/maintainer-only tooling** — no buyer ever `import`s them at runtime.
- Publishing 28 packages means 28 version bumps, changelogs, and OIDC publish steps per release.

This conflicts with the repo's own **KISS / YAGNI / DRY** stance and the "promote to shared code
only on a real second consumer" rule. The mistake was conflating **"is a clean module"** with
**"is a separately-published npm package."** They are two different boundaries.

## Decision

**Collapse the publish surface from 28 → 6.** Keep the one-interface-per-concern *module* pattern;
change only what is *published*. Every `packages/*` concern lands in exactly one of four buckets:

1. **Public npm `@vybekiit/*` (6)** — buyer-runtime spine with real headless logic and heavy vendor
   deps or genuine cross-template runtime sharing:
   `core` (absorbs `http` as subpaths), `payments`, `auth`, `db`, `tokens`, `client-state`.
   These stay `publishConfig.access: public`; the update-kit semver story depends on them.

2. **`shared/` → copied into each scaffold as OWNED code** — cross-template runtime concerns that
   would duplicate if hand-forked per template: `report-mode`, `observability`, `security`,
   `analytics`. Single source lives once in the monorepo; the CLI copies it into the buyer's repo on
   `vybekiit new`, exactly as the agent layer already ships (ADR-0007). DRY in our repo, owned in
   theirs, off npm.

3. **Folded into templates as OWNED (package deleted)** — thin, `local`-only, single-consumer stubs:
   `seo` `cms` `compliance` `realtime` `i18n` `jobs` `kv` `search` `ai` `email` `assets`
   `notifications`. Their code is template app code in a package costume. `notifications`'
   `sendTwilioSmsOtp`/`verifyTwilioSmsOtp` (the only bit a *published* package uses) moves **into
   `auth`**, severing the `auth → notifications` edge.

4. **Private workspace packages (`private: true`, never npm)** — agent/maintainer-only tooling:
   `browser-automation`, `ui-catalog-mcp`, `deploy` (CLI-only, zero template imports), and
   `agent-kit` (bundled into the published CLI via tsup `noExternal`, so the CLI needs no public
   `@vybekiit/agent-kit`).

**Governing rule (also in `CODE-STYLE.md`):** a concern earns a **published** `@vybekiit/*` slot only
when it has real headless logic **AND** (a buyer runtime consumer **OR** ≥2 real adapters).
Otherwise it is `shared/` copy-on-scaffold code, template-owned code, or a private workspace package.
**A new module is not a new published package.**

## Consequences

- **6 npm packages** to publish/version/changelog instead of 28 — the OIDC `publish.yml` matrix and
  `planKitUpdate()` shrink accordingly. Per-concern conflict-free bumps are preserved for the spine.
- **New CLI work:** `vybekiit new` gains a `shared/` copy step (extends the existing agent-layer copy
  mechanism). `verify-presets`/`check-template-agent-layer` gain a check that copied `shared/` code is
  in sync with its monorepo source.
- **`http` folds into `core`** as subpath exports (`@vybekiit/core/http`, `.../http/client`,
  `.../http/express`, `.../http/next`); the optional `express` peer dep moves with it.
- **Migration is mechanical but wide** — 22 packages change bucket. Do it as its own tracked slice,
  not inside an unrelated PR. Template imports of folded concerns rewrite to local owned paths;
  imports of `shared/` concerns rewrite to the copied path.
- ADR-0012's "twelve new packages" decision is **superseded** on the publish axis; its adapter-behind-
  one-interface design is retained.
- **Open follow-up:** the two-prompt-library duplication in `cli/` (`@clack/prompts` +
  `@inquirer/prompts`) should be resolved to one before the CLI is finalized — track separately.
