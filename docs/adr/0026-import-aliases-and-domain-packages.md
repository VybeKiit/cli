# ADR-0026: Import aliases and domain package layout

## Status

Accepted — 2026-07-03

## Context

VybeKiit had three overlapping import styles:

- Template-owned adapters under `templates/*/src/vybekiit/*` imported as `@/vybekiit/...`
- Cross-folder relative imports (`../lib/...`) in templates and packages
- Inconsistent package self-imports (relative vs scoped) inside `packages/*`

Maintainers and buyer agents need one greppable rule for “where does this module live?” and one
build story for workspace packages.

## Decision

### Import aliases (SSOT)

| Surface | Alias | Maps to |
|---|---|---|
| Templates (web, spa, mobile, extension, backend) | `@/*` | `./src/*` |
| Monorepo packages | `@vybekiit/<pkg>` and `@vybekiit/<pkg>/*` | `packages/<pkg>/src` via root `tsconfig.base.json` |
| Colocated same folder | `./` | Allowed |
| Parent-relative | `../` | **Banned** — use `@/` (templates) or `@vybekiit/<pkg>/…` (packages) |

Import order (Biome `organizeImports`): external → `@vybekiit/*` → `@/*` → `./`.

Template HTTP client helper SSOT: `@/lib/fetchJson` (not only `@vybekiit/core/http/client`).

### Domain adapters → workspace packages

Promote former `templates/*/src/vybekiit/{ai,analytics,assets,cms,compliance,email,i18n,jobs,kv,notifications,realtime,search,seo,tenancy,tokens}` into
`packages/<domain>/src`. Templates depend on them via `workspace:*` and import `@vybekiit/<domain>`.

HTTP response decode schemas live in `@vybekiit/core/http` (`responseSchemas.ts`).

### Build

- Root `tsconfig.base.json` `paths` is the SSOT for `@vybekiit/*` resolution.
- Each package `tsconfig.json` sets `"baseUrl": "../.."`.
- `scripts/tsupWorkspaceAliases.mjs` esbuild plugin resolves `@vybekiit/*` during `tsup` builds.

### Extension layout

Extension template uses WXT `srcDir: 'src'`; `@/*` → `./src/*`.

## Consequences

- **Positive:** One import vocabulary across templates and packages; domain logic is no longer duplicated per template tree.
- **Positive:** Codemods + Biome organizeImports keep imports consistent.
- **Neutral:** ADR-0025 publish-surface collapse is unchanged — these domain packages remain workspace packages until folded into the five public npm slots or template-owned code per that ADR.
- **Negative:** Templates must declare workspace deps and packages must be built (`pnpm --filter "./packages/*" build`) before typecheck in a clean checkout.

## References

- `CODE-STYLE.md` → Import aliases
- `scripts/codemodImportAliases.mjs`, `scripts/migrateDomainPackages.mjs`
- `tsconfig.base.json`
