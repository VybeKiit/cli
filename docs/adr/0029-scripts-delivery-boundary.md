# ADR-0029: Scripts delivery boundary (maintainer vs buyer)

## Status

Accepted — 2026-07-03

## Context

The monorepo `scripts/` folder mixed maintainer tooling (mirror sync, UI registry sync, codemods) with JSON manifests and shared libs. Several template scripts delegated to monorepo paths (`../../scripts/checkAgentPatterns.mjs`) that **do not exist** after CLI scaffold or mirror delivery — breaking buyer `pnpm verify`.

Buyers receive `templates/*` via subtree mirror + `vybekiit new`. Anything tracked under `templates/*/scripts/` is copied verbatim unless explicitly excluded.

## Decision

1. **Group maintainer scripts** under `scripts/dev/{mirror,sync,checks,codmods,publish,preview}/`.
2. **Shared non-delivered code** under `scripts/lib/`; **manifests** under `scripts/data/`.
3. **Template scripts stay self-contained** — full implementation in each `templates/*/scripts/checkAgentPatterns.mjs`; monorepo runner at `scripts/dev/checks/checkAgentPatterns.mjs` loops templates.
4. **Exclude `scripts/dev/` from buyer delivery** via CLI `shouldCopyScaffoldPath` and `scripts/dev/` entries in shipped template `.gitignore` files (local maintainer scratch only — not tracked in mirrors).

## Consequences

- Root `package.json` script paths update to `scripts/dev/...` (names unchanged: `pnpm mirror`, `pnpm sync:ui`, …).
- Package `tsup.config.ts` imports move to `scripts/lib/tsupWorkspaceAliases.mjs`.
- Docs cite `scripts/data/ui-registry-manifest.json` instead of `scripts/ui-registry-manifest.json`.
