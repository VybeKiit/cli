# ADR-0013: Unified kit release line

## Status

Accepted — 2026-06-29

## Context

VybeKiit ships through six GitHub repos: one maintainer monorepo and five delivery mirrors
(`web`, `mobile`, `extension`, `cli`, `infra`). Buyers update maintained code via npm semver
and owned templates via `git pull` on mirrors — not by reading git tags.

Maintainers still need a single release line to answer: *which kit version shipped this fix?*
Alternatives considered:

1. **Independent semver per mirror** — web v2.1, mobile v1.4, etc.
2. **Monorepo tag only** — mirrors untagged
3. **Unified kit release** — one `vX.Y.Z` on monorepo + same tag on every mirror after sync

## Decision

Adopt **unified kit releases**:

- Root `package.json` version is the canonical kit semver
- Every merged PR (unless `no-release`) cuts `vX.Y.Z` on the monorepo
- `pnpm mirror` runs, then `tag-mirror-repos.mjs` stamps the same tag on each mirror HEAD
- GitHub Release notes live on **monorepo only** — mirrors get git tags, not duplicate Release pages
- npm package versions bump in lockstep via `bump-kit-version.mjs`; publish via OIDC `publish.yml`

Buyers never see kit tags (maintainer-only).

## Consequences

- One place to read changelog: `VybeKiit/vybekiit` Releases
- Support can ask maintainers to check `git describe --tags` on a buyer's mirror clone
- Mirror force-push does not preserve old tags on mirror SHAs — tags are re-created each release at new HEAD (intentional)
- npm Trusted Publisher must be registered per package, all pointing at the same `publish.yml`
