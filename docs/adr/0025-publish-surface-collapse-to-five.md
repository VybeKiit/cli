# ADR-0025: Collapse the published surface to five (no `shared/` tier)

**Status:** Accepted (supersedes ADR-0022 on the publish axis; refines ADR-0012)
**Date:** 2026-07-02

## Context

ADR-0022 already decided to collapse the maintained surface from 28 published packages, but it
landed on **six** published packages plus a new **`shared/` copy-on-scaffold tier** (for
`report-mode`, `observability`, `security`, `analytics`). Two things became clear before that reorg
was executed:

1. **The `shared/` tier never shipped** — no `shared/` directory exists. It would be a *third*
   distribution mechanism (alongside npm packages and template-owned code) for the maintainer to
   build, teach, and keep in sync. That is more machinery, not less — the opposite of the KISS goal
   that motivated the collapse.
2. **Its members split cleanly without it.** `observability` and `security` are foundation every app
   needs (a logger; rate-limit + origin-lock) — they are not swappable-adapter concerns, so they
   belong **inside `core`** as subpaths, exactly like `http`. `report-mode` and `analytics` are
   template UX — they are **owned template code**. `tokens`, likewise, is owned design data a buyer
   customizes, and a buyer only ever scaffolds **one** stack, so "duplicated across templates" is
   never buyer-facing duplication — a maintainer `check:templates` gate keeps the copies consistent.

With `shared/` removed and `tokens` reclassified as owned, the published spine is **five**, not six.

## Decision

**Collapse the published surface from 28 → 5, into exactly three buckets. There is no `shared/`
tier.**

1. **Public npm `@vybekiit/*` (5)** — buyer-runtime spine with real headless logic:
   `core`, `payments`, `auth`, `db`, `client-state`. `core` **absorbs** the foundation plumbing as
   subpath exports: `@vybekiit/core/http` (`.../http/client`, `.../http/express`, `.../http/next`),
   `@vybekiit/core/observability` (the `createLogger`), and `@vybekiit/core/security` (rate limit,
   origin lock). `auth` absorbs the Twilio SMS-OTP helper from `notifications`, severing the
   `auth → notifications` edge (as in ADR-0022).

2. **Template-owned (package deleted, code copied into templates as OWNED)** —
   `tokens`, `report-mode`, `analytics`, and the thin long tail: `seo` `cms` `compliance` `realtime`
   `i18n` `jobs` `kv` `search` `ai` `email` `assets` `notifications` `tenancy`. Cross-template code
   (design `tokens`) lives in each template and is kept in sync by the maintainer `check:templates`
   gate — never a shared package.

3. **Private workspace packages (`private: true`, never npm)** — agent/maintainer-only tooling:
   `browser-automation`, `agent-kit` (bundled into the published CLI via tsup), `ui-catalog-mcp`,
   `deploy`.

**Governing rule (also in `CODE-STYLE.md` / `AGENTS.md`):** a concern earns a **published**
`@vybekiit/*` slot only when it has real headless logic **AND** (a buyer runtime consumer **OR** ≥2
real adapters). Otherwise it is template-owned code or a private workspace package. Foundational
plumbing folds into `core`. **A new module is not a new published package.**

**Adjacent decisions folded in (the grill also settled these):**

- **CLI prompts standardize on `@clack/prompts`.** `@inquirer/prompts` is removed (its one use,
  `cli/src/prompts/envWizard.ts`, ports to `@clack`) and banned via `noRestrictedImports`. Resolves
  the open follow-up ADR-0022 left dangling.
- **Structure docs are split three ways.** `CONTEXT.md` keeps orientation + decisions; a new
  **`PROJECT.md`** holds purpose + direction; a new **`LANGUAGE.md`** holds the names-only glossary
  (moved out of `CONTEXT.md`). `CODE-STYLE.md` stays the SSOT for how code is written.

## Consequences

- **5 npm packages** to publish/version/changelog instead of 28 — the OIDC `publish.yml` matrix and
  `planKitUpdate()` shrink to the spine. Per-concern conflict-free bumps are preserved.
- **No third distribution mechanism.** Every concern is either published, owned-in-template, or
  private — the three buckets a maintainer already understands. `vybekiit new` needs **no** new
  `shared/` copy step (the copy-on-scaffold work ADR-0022 anticipated is dropped).
- **`core` grows subpaths** (`/http`, `/observability`, `/security`) via the tsup entry map; the
  optional `express` peer dep moves onto `core`. Consumers rewrite `@vybekiit/{http,observability,
  security}` → `@vybekiit/core/*`.
- **Two importer edges must be rewired before their packages go private** — `agent-kit` is imported
  by ~15 template sites and `deploy` by ~17 cross-package sites. `agent-kit` is bundled into the CLI
  (`noExternal`); `deploy` is CLI-only. Template runtime imports of either must resolve to owned code
  or the CLI, not a published package, before the `private: true` flip.
- **Migration is mechanical but wide** — 23 packages change bucket. Executed as its own tracked slice
  (`reorg/organize-by-purpose`), gate-green, not inside an unrelated PR. **Sequenced before finishing
  the Effect migration (ADR-0023)** so those slices run against the smaller 5-package surface rather
  than migrating 23 packages about to move.
- **Enforcement flips land with their code, not ahead of it** — `noConsole`/`noDefaultExport` to
  `error` on the published spine, and `noRestrictedImports` for `zod`/`@inquirer`, are turned on in
  the same gate-green PR that removes the last violation, never before (or the gate goes red).
- **Supersedes ADR-0022 on the publish axis** (6 → 5, and the `shared/` tier is dropped). ADR-0022's
  adapter-behind-one-interface design and its bucket-decision rule are retained.
