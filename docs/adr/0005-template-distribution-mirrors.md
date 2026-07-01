# ADR-0005 — Template distribution: private per-template mirrors, CLI clones via `gh`

- **Status:** Accepted (extended 2026-06-29 — see "Update")
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

A buyer runs `npx vybekiit web` to scaffold a project. The CLI's `scaffold()` copies template files
from a `source` directory, resolved by `resolveTemplatesDir()` as `../../templates` relative to the
CLI's `dist`. That path only exists **inside the monorepo**, and `cli/package.json` ships
`files: ["dist"]` — so a real published install has **no template files to copy**. Template delivery
was unimplemented; the code comment ("a real published install resolves them from the private repo")
described an intent with no mechanism.

The org already had README-only placeholder repos — `VybeKiit/web`, `VybeKiit/mobile`,
`VybeKiit/extension`, `VybeKiit/cli`, `VybeKiit/infra` — each described as a mirror of a monorepo
path. They were always meant to be the delivery channel; nothing populated or consumed them.

Two hard constraints shape the answer:

1. **The gate must hold.** Templates + the agent layer are the proprietary OWNED product (ADR
   backbone: "Owned vs Maintained"). They must **not** ship inside the public npm CLI package, or
   anyone who `npm pack vybekiit` gets the product for free.
2. **The buyer is a non-coder.** Whatever authenticates a private clone cannot be "create a
   fine-grained PAT with Contents:read" — that jargon wall is exactly what this product removes.

## Decision

1. **Per-template PRIVATE mirror repos are the delivery unit.** A monorepo CI job mirrors each
   template path to its own repo on release (`git subtree split --prefix=templates/web` →
   force-push `VybeKiit/web`; same for `mobile`, `extension`). One-way, monorepo → mirror; the
   monorepo stays the single source of truth. `cli` and `infra` mirror the same way (`cli` public,
   it's on npm anyway; `infra` private).
2. **The published CLI clones the matching mirror** (`gh repo clone VybeKiit/web`), then copies +
   rewrites `workspace:*` → `^x.y.z` as today. Proprietary templates never touch public npm — the
   gate stays intact.
3. **Clone auth = `gh` device-flow login**, consistent with ADR-0001's interactive-browser-login
   rule. `vybekiit doctor` installs `gh` (now a **base** toolchain tool alongside `supabase` +
   `wrangler`); onboarding runs `gh auth login --web` once (one browser click); the CLI clones via
   `gh`'s stored token. No token is ever pasted.
4. **Gate granularity = per-template mirrors.** The paid invite (issue #4 webhook) grants the buyer
   read access to the template mirrors they're entitled to (`web` + `mobile` + `extension` — one
   bundle), **not** the maintainer monorepo. Least-privilege; the buyer never sees the maintainer
   agent layer, package source, or `infra`.

## Consequences

- **Fixes the actual delivery bug.** `resolveTemplatesDir()`/`scaffold()` gain a clone path for
  published installs; the monorepo-local path stays as the dev/`VYBEKIIT_TEMPLATES_DIR` override.
- **`gh` becomes a hard dependency** for scaffolding and joins `doctor`'s base toolchain + the
  onboarding login hand-off. One more browser click in session #1 (already the established pattern).
- **Mirrors are derived artifacts.** They are force-pushed and never hand-edited; a contributor who
  edits a mirror loses the change on the next sync. The sync job and this rule must be documented in
  each mirror's README.
- **Invite logic targets multiple repos.** The webhook adds/removes the buyer across the template
  mirrors rather than one repo; refund → removed from all. More API calls, cleaner blast radius.
- **Updates flow two ways:** npm version bumps for `@vybekiit/*` (the MAINTAINED packages), and
  `update-kit` re-fetching the mirror for the OWNED template files (the CLI can re-pull on demand).
  The initial scaffold copies files **clean** — the clone's `.git` is skipped — so the buyer starts a
  fresh project rather than inheriting the mirror's shallow history + remote.

## Alternatives rejected

- **Bundle `templates/` into the public CLI package** (`files: ["dist","templates"]`): simplest and
  works offline, but publishes the proprietary OWNED template code on public npm — the gate leaks.
- **Buyer clones the whole private monorepo** and runs the CLI from inside (current path "just
  works"): no mirror infra, but the buyer gets the maintainer monorepo — maintainer agent layer, all
  package source, `infra` — messy and leaks internals.
- **PAT paste / tarball via API for auth:** PAT creation is the jargon wall this product removes; the
  authenticated tarball download needs the same `gh` login yet is no simpler than `gh repo clone`,
  while losing the option for `update-kit` to re-pull the mirror later.

## Update (2026-06-29) — generalized to all five repos, populated, triggers widened

The original sync (`scripts/mirrorTemplates.mjs` + `mirror-templates.yml`) only ever covered the
three templates, fired `on: release` only, and silently swallowed push failures. With zero releases
cut, every mirror sat **empty** — so a real `npx vybekiit web` would clone an empty repo. This
session closed that gap and reconciled the code with the prose above:

1. **One registry, five repos.** `scripts/mirrorRepos.mjs` replaces the templates-only script with a
   `MIRRORS` map of `{ repo, path }`: `web`/`mobile`/`extension` (`templates/<name>`), `cli` (root
   `cli/`), and `infra` (`infra/`). The split prefix is now the mapped `path`, so a mirror's source
   need not sit under `templates/` — this is what lets `cli` mirror at all (its prefix is the repo
   root, which the old hardcoded `templates/${name}` could never reach).
2. **`cli` is public; everything else private.** Confirmed the prose's "cli public, it's on npm
   anyway" over the org's then-private setting — the CLI source is scaffolding logic only (clone +
   `workspace:*` rewrite), ships no templates and no secrets, so the gate (GitHub repo-access on the
   *template* mirrors) is unaffected by publishing it.
3. **`infra` is registered but dormant.** No `infra/` source exists yet (issue #7 creates the
   Cloudflare + Supabase deploy config). A mirror whose mapped path is absent is **skipped with a
   notice**, never force-pushed empty — a destructive push of a non-existent prefix would clobber the
   repo. `infra` populates automatically once #7 lands its source.
4. **Triggers widened to `push:main` (paths-filtered) + `release` + `workflow_dispatch`.** Mirrors
   now re-sync whenever mirrored source lands on `main`, so a buyer scaffolding mid-week gets current
   code rather than the last tag. The release trigger stays for deliberate versioned snapshots.
5. **Failures now surface.** The previously dead `redact()` helper is wired into real per-mirror
   success/failure logging (token-redacted), replacing the silent swallow.
6. **Guarded by a test in CI.** `scripts/mirrorRepos.test.mjs` (run via `pnpm test:scripts`) locks
   the registry invariants: arg validation rejects typos, the token never leaks into a log line, and
   every present mirror's source prefix exists on disk (drift guard).

**Not mirrors:** `apps/landing` ships from the monorepo via its own deploy (issue #7), not a mirror —
it is the store, not OWNED scaffold payload. The platform-skills "skills-bag" (`pin-platform-skills.mjs`
+ `platform-skills.manifest.json`, ADR-0007) pins upstream skills *into* the templates before sync; it
is not a separate delivery repo.

## Update (2026-06-29) — pre-push primary, CI dispatch fallback

Mirror sync triggers moved from CI push/release to the **maintainer pre-push hook** (after the
quality gate). Rationale from `/grill-with-docs`:

1. **Pre-push is the automatic path.** After lint → typecheck → test → build, the hook runs
   `pin-platform-skills`, aborts if pin left uncommitted changes (subtree split uses commits only),
   then `pnpm mirror` (all five repos, every monorepo push). Auth is the local `gh` credential
   helper — no `GH_MIRROR_TOKEN` required on the maintainer machine.
2. **CI push/release triggers removed.** The parallel `push:main` job raced with verify and could
   publish to mirrors before CI failed; the maintainer always lands code via local `git push`, so
   pre-push is authoritative.
3. **`workflow_dispatch` kept as emergency fallback.** For `--no-verify`, a machine without husky,
   or a failed mirror push — needs `GH_MIRROR_TOKEN` in GitHub Actions secrets.
4. **Accepted trade-off:** mirrors update from local commits *before* the monorepo remote receives
   the push. If the push fails after mirror succeeds, delivery mirrors can briefly lead GitHub
   `main`. Chosen over CI-after-green for speed given the always-local-push maintainer workflow.
