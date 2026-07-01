# ADR-0023: Adopt Effect end-to-end (Schema replaces zod, tagged errors replace Result, Layer/Context DI)

**Status:** Accepted (supersedes the `Result` error model; refines ADR-0018)
**Date:** 2026-07-01

## Context

VybeKiit's headless packages signal expected failures with a `Result<T, VybeKiitError>` discriminated
union (`ok`/`err`/`fail`), validate config and DTOs with **zod**, and construct providers with plain
`resolveXProvider(env)` factories. It works, but it is three separate hand-rolled idioms — `Result`
plumbing (391 call-sites across 86 files), zod schemas, and ad-hoc dependency wiring — that the owner
wants collapsed into one composable model.

**Decision drivers (owner, this session):** a single cleaner effect model across the whole kit; typed
errors that compose; first-class dependency injection; one validation library. The owner explicitly
chose the **maximal** adoption after the KISS-scoped alternatives (Effect-internal-only, surgical
adoption, keep-zod-alongside, defer-DI) were each presented with their code cost and declined. Those
KISS objections are recorded here and in the migration plan; the owner's taste is the source of truth.

## Decision

Adopt **Effect (Effect-TS), pinned at `effect@3.21.4`**, across the entire monorepo — the published
`@vybekiit/*` surface **and** the buyer templates.

1. **Errors — tagged errors replace `Result`.** Package methods return `Effect.Effect<A, E, R>`.
   Expected failures are `Data.TaggedError` subclasses (e.g. `PaymentError`, `AuthError`) carrying a
   stable `code` + `message`. The `Result`/`ok`/`err`/`fail` module is removed. Programmer and config
   errors still **throw** (fail-loud at boot).
2. **Validation — Effect `Schema` replaces zod.** Each concern owns a `Schema.Struct` (per-package,
   per ADR-0022's config decision). `zod` is dropped from every manifest; the approved zod 3→4 upgrade
   is **cancelled as moot**. The `parseEnv(schema, env)` seam is kept but reimplemented over
   `Schema.decodeUnknownSync`, formatting `ParseError` into the existing "Invalid VybeKiit
   configuration" throw — so the 108 decode call-sites stay shallow.
3. **DI — `Context.Tag` services wired by `Layer`.** Each concern exposes a **Config Tag + Layer** and
   a **Provider Tag + Layer**. Composition roots (routes, cli, hooks) provide the Layers and run at the
   edge — `Effect.runPromiseExit` on servers, a single `ManagedRuntime` on clients. The existing
   `resolveXProvider` factory bodies are retained and wrapped by `Layer.effect`.
4. **Tests — `@effect/vitest@0.29.0`** (`it.effect` + `Exit`/`Either` assertions) on **vitest 3.2.6**
   (Slice 0). The stable `@effect/vitest` peers `vitest ^3.2.0` + `effect ^3.21.0`, which is why vitest
   is capped at 3.x and **not** 4.1.9 (that would force a `@effect/vitest@4.0.0-beta`).

This **supersedes** the "return `Result` for expected failures" rule and the central-zod-config approach
in `CODE-STYLE.md`. It **refines ADR-0018**: provider dispatch survives as a concept but now yields
Effect services/Layers instead of a plain factory return; `resolveEnvProvider` becomes an Effect/Layer
selector, not a synchronous switch-replacement.

## Consequences

- **The buyer surface changes.** `effect` now ships in every buyer's `node_modules`, and the
  buyer-facing agent must write `runPromise` / tagged-error / Layer code. This is the sharpest tension
  with the non-coder promise; it is mitigated only by **Slice 7 (agent-layer retraining), which is
  therefore load-bearing, not optional.** Buyer-facing *prose* stays jargon-free (Decide + Guide); the
  generated *code* uses Effect.
- **Migration is large and staged:** 391 `ok/err/fail` sites / 86 files, 108 `parseEnv` sites, ~90
  runtime edges, 28 packages. Executed as nine gate-green slices (see the plan), never one PR.
- **`parseEnv` name + signature preserved** → decode call-sites stay shallow; only the engine changes.
- **Three idioms retired into one:** `Result` plumbing, zod, and hand-wired providers collapse into
  Effect + Schema + Layer.
- **Version pins:** `effect@3.21.4`, `@effect/vitest@0.29.0`, `vitest@3.2.6`. Effect's API moves fast —
  pinned exactly, bumped deliberately.
- **Accepted trade:** added conceptual weight (Effect is not "boring / junior-readable") is the
  deliberate price for composability and typed effects.
