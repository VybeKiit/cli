# ADR-0018 — Provider dispatch SSOT in `@vybekiit/core`

- **Status:** Accepted
- **Date:** 2026-06-30
- **Deciders:** Yosef (owner), via provider-dispatch SSOT plan

## Context

ADR-0002 introduced one interface + swappable adapters per concern, with `resolveEnvProvider`
in `@vybekiit/core` as the canonical dispatch shape for payments/kv/analytics. Most other packages
(and `cli/doctor`) still hand-rolled `switch` statements and raw `env.*_PROVIDER ===` compares.
That duplication produced nested ternaries, scattered AWS/Railway logic, and divergent fallbacks —
bugs that ship to buyers as npm bumps and `doctor` behavior.

## Decision

1. **All provider routing extends core** — `parseEnv(<schema>)` for keys,
   `resolveEnvProvider(key, registry, env, defaultKey)` for dispatch. New adapter = registry entry,
   not a new `switch` branch.
2. **Shared stack helpers live in core** (`provider-dispatch.ts`):
   `isCloudflareUnconfigured`, `isSupabaseUnconfigured`, `isRailwayStackActive`,
   `needsAwsCliFromAuxiliaryProviders`. Two packages needing the same env signal → lift to core.
3. **Package-specific pre-checks stay local** when domain-specific (e.g. `isDataUnconfigured` in
   `@vybekiit/db`, `isAuthUnconfigured` in `@vybekiit/auth` per ADR-0008) but must not re-parse
   provider keys with raw env string compares.
4. **Mechanical enforcement** — `scripts/checkProviderDispatch.mjs` in `pnpm verify`; maintainer
   skill `.agents/skills/extend-provider-dispatch/SKILL.md`; Biome `noNestedTernary` as error.

## Consequences

- **Amends ADR-0002** — dispatch shape is mandatory for every `packages/*/src/resolve.ts` and
  doctor planner modules, not only payments-style packages.
- **CLI depends on `@vybekiit/core`** for toolchain selection — acceptable for SSOT.
- **Maintainer skill is not buyer-facing** — vibe coders consume outcomes via npm; jargon stays in
  the maintainer layer (`AGENTS.md`).

## References

- ADR-0001 — agentic CLI toolchain (`toolchain.ts` pure planner)
- ADR-0002 — multi-provider adapters
- `packages/payments/src/resolve.ts` — reference registry implementation
