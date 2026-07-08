# ADR-0035: Package kinds — `vybekiit.kind` drives per-package rules

## Status

Accepted.

## Context

Not every `packages/*` obeys the same style rules, and the guide relied on prose exceptions that
agents had to guess at. `core` is a foundation library with no provider seam; `agentKit` and
`browserAutomation` are agent-only tooling whose job is terminal output (so `console` is correct
there); `tokens` and `reportMode` are buyer-facing owned code that folds into templates; the money
spine (`payments`, `auth`, …) are provider concerns that must carry the full skeleton. Auditors and
the biome `console` carve-out both had to re-derive "what kind of package is this?" from ad-hoc path
lists, which drift and disagree (an audit even applied the component-naming rule two different ways).

ADR-0033 also means the long tail will move — some packages fold into templates as owned code, others
stay private tooling. A classification that lives in a central table has to be re-edited on every
move.

## Decision

1. **Every package declares its kind** in `package.json` under `vybekiit.kind`, one of:
   `concern` (a provider seam, swappable adapters) · `library` (foundation, no seam) ·
   `owned` (buyer-facing UI that folds into templates) · `tooling` (agent/maintainer-only: CLI, MCP,
   automation).
2. **Kind drives the rules.** Only `concern` earns the full `types`/`config`/`resolve`/`providers`/
   `index` skeleton. Only `tooling` may use `console`; every other kind returns an `Effect` or uses
   `createLogger`. `library`/`concern` keep pure wildcard `index.ts` barrels.
3. **The label is the SSOT**, colocated so it travels with the package through the ADR-0033 reorg. The
   biome `noConsole` carve-out paths and the concern-skeleton check both read it.
4. **`check:packages` enforces it** (`scripts/dev/checks/checkPackages.mjs`, wired into `verify`): a
   package with a missing/invalid kind, a non-`private` manifest, a `publishConfig`, or a `concern`
   with no `resolve.ts`/`index.ts` fails the gate.

Chosen over deriving kind purely from structure: structure is ~90% sufficient but has real edge cases
(`deploy` is `tooling` yet has a `providers/` dir; `walkthrough`/`tokens` are `owned` yet look like
libraries). A declared label removes the ambiguity and survives package moves without a central table
to keep in sync.

## Consequences

- Adding a package means choosing its kind first; the recipe in `CODE-STYLE.md` leads with it.
- The trade-off accepted: the field duplicates what structure often implies (a mild DRY cost), in
  exchange for an unambiguous, move-robust, machine-readable classification.
- When the ADR-0033 reorg folds an `owned` package into a template, its manifest (and kind) disappears
  with it — no central list to prune.
