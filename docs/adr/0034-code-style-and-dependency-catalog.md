# ADR-0034: Code style, Effect seams, and dependency catalog

## Status

Accepted.

## Context

The maintainer repo is mid-migration: ADR-0033 settled the publish surface, and ADR-0023 is still
moving packages from `Result` / zod / factory wiring to Effect + `Schema` + `Layer`. The existing
style guide still reflected parts of the old shape: service interfaces as primary contracts,
one-line TSDoc on every export, fallback provider maps, scattered dependency ranges, and `index.ts`
barrels that could contain code.

That ambiguity makes every touched slice negotiable again. The guide needs to record the desired
end-state, even while the implementation migrates one gate-green slice at a time.

## Decision

1. **Effect is the end-state seam.** New/touched maintained code returns `Effect<A, E>` with
   `Data.TaggedError` expected failures. `Result` remains a temporary bridge only. IO is wrapped with
   `Effect.try` / `Effect.tryPromise`; recovery uses `Effect.catchTag` / `Effect.catchAll`.
2. **Provider wiring is Layer-first.** Each adapter exposes a Live Layer. Schema config owns explicit
   defaults; missing runtime adapter maps return a typed error before construction. No
   `adapters[key] ?? adapters.default` fallback.
3. **Contracts are Schema-first.** DTOs, config, and wire payloads are `Schema.Struct` values with
   `Schema.Schema.Type<typeof X>` aliases named `XType`. Interfaces remain mainly for component
   props and framework contracts.
4. **Functions are const-arrow.** Authored functions use `const` arrow form. `function*` remains
   allowed inside `Effect.gen`.
5. **Function TSDoc is complete.** Every exported function has a summary, `@param` for every
   parameter, `@returns`, and `@example`. Durable rationale goes in ADRs or `CONTEXT.md`.
6. **`index.ts` is a pure barrel.** Package entrypoints contain wildcard re-exports only and no
   implementation code, constants, side effects, service wiring, or fallback logic.
7. **Component props default at the boundary.** Component prop contracts remain interfaces; optional
   props get safe defaults where sensible, including `children` defaults by case.
8. **AI-slop tells are banned.** Generic micro-helpers like `isRecord`, `isObject`, `isDefined`,
   `noop`, `assertNever`, one-row predicates like `isName` / `isKey`, and generic names like
   `result` / `data` / `temp` are not style exemplars.
9. **Dependency versions use pnpm catalogs.** Shared external versions live in
   `pnpm-workspace.yaml` and workspace manifests use `catalog:`. Exact latest stable is the default;
   peer/framework exceptions are documented. Current exceptions: Vitest stays on `3.2.6` because
   `@effect/vitest@0.29.0` peers `vitest ^3.2.0`; TypeScript stays on the repo's 5.x lane until the
   TS 6 upgrade is its own gate-green pass.
10. **CLI remains lightweight.** Keep the local parser + typed command registry until nested flags,
    completions, or shell integrations justify a parser dependency. Command cores return structured
    `CommandResult`; the entrypoint renders human output or JSON once. Prompt code stays behind the
    `@clack/prompts` boundary.

## Consequences

- `CODE-STYLE.md` is prescriptive and may describe code that has not been migrated yet. When touching
  an old slice, convert that slice toward the guide rather than copying the old pattern.
- Some lintable rules are documented before they become hard errors because the repo still contains
  known offenders. Promote them to Biome/custom checks with the code slices that remove existing
  violations.
- The lockfile changes when catalog versions move; dependency bumps should be reviewed as catalog
  changes, not per-package drift.
