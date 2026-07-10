# ADR-0033: The CLI is the only published artifact; access is gated at the CLI

## Status

Accepted — supersedes the "5 published spine" of [ADR-0025](./0025-publish-surface-collapse-to-five.md).

## Context

[ADR-0025](./0025-publish-surface-collapse-to-five.md) collapsed the publish surface from 28 packages to a
**5-package public spine** (`core`, `payments`, `auth`, `db`, `client-state`) plus the `vybekiit`
CLI, with templates rewriting `workspace:*` → `^version` at scaffold time so a buyer's app installed
the spine from public npm ([`cli/src/lib/rewriteDeps.ts`](../../cli/src/lib/rewriteDeps.ts)).

That model gives away the maintained logic for free on npm and complicates the paywall: anyone can
`npm i @vybekiit/*`. VybeKiit is a **paid** kit — the paid wall (["the gate"](../../apps/landing/src/lib/gate.ts))
invites a buyer's GitHub account to the **private delivery mirror repos** after checkout. The buyer
gets the whole monorepo via that gated mirror, not via loose npm installs.

So publishing the concern packages to public npm both leaks the product and creates a second,
weaker distribution path that bypasses the gate.

## Decision

1. **One public artifact: the `vybekiit` CLI.** Every `packages/*` is `private: true` (no
   `publishConfig`). Nothing under `packages/` is ever published to npm. `publish.yml` publishes
   **only** the CLI via OIDC; the derived `publishPackages.mjs` script and its `publish:packages`
   npm scripts are removed.
2. **The CLI is self-contained.** It bundles every `@vybekiit/*` dependency it uses
   (`tsup` `noExternal: [/^@vybekiit\//]`); those packages move to the CLI's `devDependencies` so the
   published `package.json` declares no unresolvable `@vybekiit/*` runtime dep.
3. **Delivery is the gated monorepo clone.** Buyers work inside the private mirror where
   `workspace:*` resolves locally. The scaffold no longer rewrites deps to npm —
   `rewriteDeps.ts` and its test are deleted; `scaffold()` copies templates verbatim, keeping
   `workspace:*`.
4. **Access gate at the CLI.** Every command except `help`/`version`/`doctor` runs a preflight
   ([`cli/src/doctor/gate.ts`](../../cli/src/doctor/gate.ts)) that, via the installed `gh` CLI,
   passes if the signed-in GitHub account is **EITHER** an active member of the org **OR** a
   collaborator on a private delivery repo. If neither, it prints plain-language purchase guidance
   and exits non-zero; re-running re-checks, so access granted after checkout simply passes.
   `doctor` is exempt so an ungated buyer can still install/sign in to `gh`. `VYBEKIIT_SKIP_GATE=1`
   bypasses the gate for CI/automation.

## Consequences

- The public `@vybekiit/*` spine no longer exists — `update-kit`'s "bump the npm version" flow is
  replaced by pulling the gated mirror. CODE-STYLE.md's "A new module is not a new published
  package" rule and Never list are updated: the buckets are now **template-owned** vs **private
  workspace package** (there is no public tier).
- The published CLI bundle is larger (it inlines the concern packages + their transitive deps).
  Acceptable for a dev CLI; measured at build time.
- **Follow-up (closed by product contract):** `new`/`drop` still copy a single template into a *fresh
  external* directory, where `workspace:*` cannot resolve. The buyer journey, `create app` grammar,
  kit-workspace delivery, full doctor inventory, and post-create presets / page recipes / backends /
  update path are specified in
  [ADR-0038](./0038-cli-buyer-journey-and-create-app.md) (Tracks 1–2). The dep-rewrite removal here
  only stops pointing buyers at now-nonexistent npm packages; ADR-0038 owns the redesign.
- Stale publish docs (`docs/npm-first-publish.md`, `docs/wave-b-live-spine.md`,
  `docs/release-ci-setup.md`) describe the retired spine-publish model and are superseded by this ADR.
