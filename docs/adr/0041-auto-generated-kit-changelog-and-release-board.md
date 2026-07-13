# ADR-0041 — Auto-generated kit changelog + maintainer release board

- **Status:** Accepted — grilled with the owner via `/grill-with-docs` (2026-07-12). Supersedes the
  gap where the kit had **no changelog SSOT**. Implementation slice (generator + `CHANGELOG.md` +
  data JSON + `/changelog` board + release/deploy wiring) lands under this ADR.
- **Date:** 2026-07-12
- **Deciders:** Yosef (owner)

Builds on [ADR-0013](./0013-unified-kit-release-line.md) (the single kit release line is the version
source), [ADR-0029](./0029-scripts-delivery-boundary.md) (dev scripts live under `scripts/dev/`, never
ship to buyers), [ADR-0033](./0033-cli-single-published-artifact-and-access-gate.md) (0 packages
publish — the kit, not npm packages, is what a changelog tracks), and reuses the status legend from
[ADR-0039](./0039-provider-preference-ladder-and-live-work.md). Distinct from the buyer-facing
`ChangelogPage` **surface recipe** (a demo screen at `/pages/changelog`); see glossary in
[LANGUAGE.md](../../LANGUAGE.md) **Distribution & release**.

## Context

The kit ships on a **unified release line** (ADR-0013): the root `package.json` version is the
canonical `vX.Y.Z` tag source, and buyers receive updates via gated mirror pulls, not per-package
npm bumps (ADR-0033). Yet there is **no record of what each release contains**:

- **No changelog SSOT** — no root `CHANGELOG.md`, no changesets / semantic-release / git-cliff. The
  history is rich, though: **336 commits** (2026-06-27 → 2026-07-12), **~80% conventional** (`feat`,
  `fix`, `chore`, `docs`, `refactor` with clean scopes — `landing`, `cli`, `payments`, `db`, …).
- **`release.yml` already cuts a GitHub Release**, but its body is only the merged PR title — no
  grouped notes.
- **Status is scattered** across four surfaces — the CONTEXT "production readiness scorecard",
  `checklist.md`, `docs/live-work-wiring-checklist.md`, and GitHub Issues — with no single view of
  "shipped vs planned vs missing".
- **"Changelog" already means something here** — `apps/componentLibrary/src/pageRecipes/ChangelogPage.tsx`
  is a **buyer** surface recipe (a demo screen buyers drop into their own app). Any maintainer
  changelog must not collide with it.

The owner asked for "a proper changelog that takes all commits, organized by feature/stage, that we
can track — with status marks for done / missing / checked." A pure changelog records only what
*shipped*; "missing" is roadmap data that commits cannot supply. So the artifact is a changelog SSOT
**plus** a derived status view, and it must stay **efficient** (auto-generated, not hand-kept).

## Decision

### 1. One generated changelog SSOT (custom `.mjs`, not an off-the-shelf tool)

`scripts/dev/changelog/generateChangelog.mjs` is the generator. It parses `git log` (conventional
commits, grouped **version-first → change type**, each line **scope-tagged**; `merge:` and
merge-commits skipped, non-conventional bucketed under **Other**, `(#NN)` linked to PRs) and emits:

- **`CHANGELOG.md`** at repo root — [Keep a Changelog](https://keepachangelog.com) format, one
  section per git tag (`v0.1.0` / `v0.1.1` / `v0.3.0` + `Unreleased`), the maintainer + GitHub
  Release SSOT.
- **`apps/componentLibrary/src/data/changelog.generated.json`** — the same data, structured, consumed
  by the board (§3).

**Off-the-shelf generators were rejected.** `git-cliff` is a Rust binary (fights the pnpm/node repo
and the ADR-0029 scripts boundary) and neither it nor `conventional-changelog` / changesets can emit
the derived status layer (§2) or the board data. A ~single-file `.mjs` in the house style
(`repoRootFrom(import.meta.url)`, colocated `*.test.mjs` under `test:scripts`) is both more capable
here and lower-dependency.

### 2. Status is derived, never hand-tracked

- **Done / shipped** ← conventional commits + **closed** GitHub Issues.
- **Planned / missing** ← **open** GitHub Issues filtered to a **roadmap-label allowlist**
  (`v1.0`, `v2`, `v3`, `money-pipeline`, `needs-secrets`, `enhancement`); `ci-failure` / `agent-triage`
  noise is excluded.
- **Status marks reuse the ADR-0039 live-work legend** — ✅ shipped+confirmed · 🔄 in-progress ·
  ⬜ not started · 🅿️ parked · 🧪 needs-secrets · 💻 pure-code. `needs-secrets` label → 🧪; no new
  vocabulary, no new tracker file.

### 3. Rendered maintainer board (not markdown badges, not a buyer surface)

A **new `/changelog` route in `apps/componentLibrary`** (the maintainer gallery app, `ui.vybekiit.com`,
not shipped to buyers) — **distinct from `/pages/changelog`** (the recipe demo). It renders the
generated JSON (version timeline, area filters, legend marks, provider logos), reusing `@vybekiit/ui`
primitives so it matches the gallery. It is **data-driven** — never hand-edited per release.

### 4. Regeneration: on-demand + release + board-deploy, no verify gate

- **`pnpm changelog`** regenerates on demand.
- **`release.yml`** regenerates and feeds the grouped notes into the **GitHub Release body**.
- **`deploy-ui-library.yml`** regenerates before build (`fetch-depth: 0` + `gh` token) so the
  **deployed** board is always current.
- **No strict drift-gate in `pnpm verify`.** `Unreleased` commits + live issues change on nearly
  every commit and need network for `gh` — a gate would be flaky and high-friction. The committed
  JSON snapshot is a convenience for local dev; the deploy step is the freshness guarantee.

## Consequences

- **New root SSOT** — `CHANGELOG.md` joins `PROJECT.md` / `CONTEXT.md` / `CODE-STYLE.md` /
  `LANGUAGE.md` as a maintainer doc. GitHub Releases finally carry real notes.
- **Glossary grows** — LANGUAGE.md **Distribution & release** gains **Kit changelog** (this) vs
  **ChangelogPage recipe** (buyer surface) so the collision never confuses an agent.
- **Unreleased is large** — ~300 of 336 commits sit under `Unreleased` since `v0.3.0` (2026-06-30).
  This nudges (does not require) a `pnpm bump-kit-version minor` → `v0.4.0` to give the changelog a
  fresh boundary. Separate action.
- **Snapshot can lag** — with no per-commit gate, the committed JSON may trail `main` between deploys;
  accepted, because the board deploy regenerates and `pnpm changelog` is one command.
- **One more dev script to keep green** — colocated `generateChangelog.test.mjs` covers the parse;
  accepted cost, consistent with every other `scripts/dev/*` tool.

## Alternatives rejected

- **`git-cliff` / `conventional-changelog` / changesets** — a foreign binary or a per-package-semver
  model (this repo publishes 0 packages, ADR-0033); none can emit the status layer or the board data.
- **A hand-kept `scripts/data/changelog-roadmap.json`** — clean, but a new tracker that drifts;
  "derive from existing SSOTs" was the chosen stance.
- **Parse the prose SSOTs** (CONTEXT scorecard / `checklist.md` / live-work tables) — brittle
  markdown-table parsing that breaks on formatting edits; GitHub Issues are the machine-readable
  source instead.
- **Strict `check:changelog` drift-gate in `pnpm verify`** — flaky (needs network) and fires on almost
  every commit; freshness handled at deploy time instead.
- **Public "What's new" on `apps/landing`** — a buyer surface can't show "missing"; the ask was an
  internal progress view. Landing "what's new" remains a future option off the same data.
- **Reuse the `/pages/changelog` recipe slug / committed SVG-WebP assets / a standalone site** —
  collision, per-release asset maintenance, and a whole new hosted surface respectively; all fight the
  efficiency goal.

## References

- Domain map: [CONTEXT.md](../../CONTEXT.md) · release line: [ADR-0013](./0013-unified-kit-release-line.md)
- Status legend source: [docs/live-work-wiring-checklist.md](../live-work-wiring-checklist.md) (Legend)
- Glossary: [LANGUAGE.md](../../LANGUAGE.md) **Distribution & release** — Kit changelog vs ChangelogPage recipe
- Code touch-points: `scripts/dev/changelog/generateChangelog.mjs` (+ `.test.mjs`), root `CHANGELOG.md`,
  `apps/componentLibrary/src/data/changelog.generated.json`,
  `apps/componentLibrary/app/changelog/page.tsx`, `.github/workflows/release.yml`,
  `.github/workflows/deploy-ui-library.yml`, root `package.json` (`changelog` script)
