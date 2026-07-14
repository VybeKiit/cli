# Lean Codebase Refactor Design

## Goal

Refactor the entire VybeKiit monorepo toward a smaller, stricter, and more predictable codebase
without changing product behavior. The result must be understandable without following unnecessary
wrappers, fallback chains, duplicated registries, vague names, or oversized function bodies.

The refactor covers authored code in `apps/`, `cli/`, `packages/`, `templates/`, and `scripts/`.
Framework-required files, generated outputs, mirrored vendor components, and delivery-required
template copies remain in scope for boundary and drift checks but are not treated as ordinary
authored code.

## Chosen approach

Use a staged, whole-repository refactor executed as independently verifiable vertical slices.

This was chosen over:

- a big-bang rewrite, which would make regressions and ownership of failures difficult to isolate;
- a policy-only cleanup, which would leave the existing structural debt in place indefinitely.

Each slice must leave its touched surface green before the next begins. The repository-wide gate
must pass before a slice is complete.

## Repository architecture

Keep the useful top-level product boundaries:

```text
apps/         runnable products, organized by feature inside framework routes
cli/          command features with one registry as the source of truth
packages/     private domain capabilities; one package only for a real boundary
templates/    self-contained buyer products; shared generation inputs stay outside them
scripts/      repository automation only
```

Apply these structural rules:

1. Organize authored internals by business capability, not generic layer names such as `helpers`,
   `common`, `misc`, or `managers`.
2. Give each concept one contract and one registry. Derive prompts, help text, configuration, and
   types from that source instead of repeating lists across files.
3. Keep provider directories only where multiple real providers exist or the provider is a genuine
   domain boundary.
4. Delete pass-through files, single-implementation interfaces, and one-use wrappers that do not
   name a domain operation.
5. Split god-files along business responsibilities. Do not split by an arbitrary line count or
   create one-export-per-file fragmentation.
6. Isolate generated and vendor code so authored-code checks do not mistake it for repository taste.
7. Preserve delivery-required duplication when each generated template must run independently.
   Maintain a singular generation source and a drift check where practical.
8. Replace broad root barrels that expose package internals with deliberate package entrypoints.
9. Merge packages or flatten folders only after usage mapping proves that the existing boundary has
   neither a second caller nor domain meaning.

## Code flow and naming

Authored functions read from input to validation to business work to side effect to output.

- Use const-arrow functions consistently.
- Use guard clauses and flat control flow.
- A condition should express one named fact. Compute complicated calls or grouped expressions before
  branching.
- Ban nested ternaries and dense parenthesized logic.
- Prefer explicit loops for multi-step business filtering. A comment above such a loop explains the
  business rule, not the syntax.
- Local working values and accumulators may mutate when their ownership is obvious. Inputs, React
  state, and shared objects remain immutable.
- Use domain nouns and verb phrases. Reject generic names such as `data`, `result`, `temp`,
  `manager`, and `handleData` whenever the value or operation has a more precise name.
- Prefer `!value`, positive boolean names, and collection length checks. Use explicit type or null
  checks only when `0`, `false`, or an empty string is a valid value.
- Avoid routine `??` defaults and fallback chains. Defaults belong at explicit input and
  configuration boundaries; missing internal state fails clearly.
- Comments explain business constraints, compatibility reasons, or surprising decisions. They do
  not narrate the code.

## Effects, contracts, and errors

Effect remains the maintained-package workflow model.

- A service, `Layer`, helper, interface, or wrapper must represent a genuine domain boundary or have
  multiple real callers.
- Expected failures use tagged errors with stable domain codes.
- Unexpected defects remain defects instead of being swallowed or converted into generic success
  values.
- Effect Schema parses untrusted values once at system boundaries. Internal functions receive
  trusted domain types and do not repeat speculative guards.
- Network, filesystem, database, process, and browser operations stay at visible I/O edges.
- Runtime defaults are decoded at configuration boundaries. Provider and registry misses are typed
  failures, not fallback selections.
- Public and domain contracts receive useful TSDoc. Obvious internal functions do not receive
  boilerplate `@param`, `@returns`, or fabricated examples.

## Testing and enforcement

1. Add characterization coverage before a refactor when the touched behavior is not already
   protected.
2. Keep unit tests beside source when practical. Integration and end-to-end suites retain dedicated
   directories.
3. Test business behavior and observable contracts rather than implementation structure.
4. Extract shared fixtures only after multiple suites demonstrate the same setup need.
5. Promote relevant Biome warnings to blocking errors as their existing violations are removed.
   Disable a rule only when it conflicts with an explicit repository decision.
6. Add focused structural checks for singular registries, package boundaries, forbidden imports or
   wrappers, and generated-file drift.
7. Mirror the final human rules in `code-style.rules.json`, including whether Biome, a repository
   check, tests, or review enforces each rule.
8. Run focused tests, typecheck, and lint during each slice. Run `pnpm verify` before the slice is
   complete.
9. Preserve CLI output, API response shapes, template behavior, and generated artifacts unless a
   separately approved behavior change says otherwise.
10. Leave no temporary compatibility layer without a documented external consumer and removal
    condition.

## Refactor sequence

The implementation plan will inventory and order exact slices, but it must follow this dependency
sequence:

1. Shorten and harden `CODE-STYLE.md`; move architecture history and framework recipes to their
   existing authoritative homes.
2. Refresh the `AGENTS.md` digest and generate the structured ruleset.
3. Make machine-catchable rules blocking without accepting a new warning backlog.
4. Establish singular registries and contracts before renaming or moving their consumers.
5. Remove needless wrappers, fallback chains, duplicated guards, and vague names one vertical
   surface at a time.
6. Split first-party god-files by business responsibility.
7. Flatten or merge proven shallow structural boundaries.
8. Apply the settled patterns to buyer templates and generated surfaces through their source and
   synchronization paths.
9. Run the final repository-wide structure review and full verification gate.

## Initial evidence guiding the plan

The read-only scan found:

- 4,766 tracked TypeScript and TSX files across the main authored surfaces;
- 28 private capability/library packages, five templates, five runnable apps, and one public CLI;
- duplicated command-surface lists and client/server contracts;
- 207 filtered declarations named exactly `data` or `result`;
- several first-party files between roughly 900 and 3,379 lines;
- widespread fallback syntax and warning-level enforcement that requires semantic review rather than
  mechanical deletion;
- required template duplication that must remain self-contained but can be generated from singular
  sources.

Counts are discovery signals, not automatic violations. Every deletion, move, or rename still
requires usage mapping and focused verification.

## Completion criteria

The refactor is complete when:

- the approved `CODE-STYLE.md` is concise enough to use as a daily contract and every rule identifies
  its enforcement channel;
- authored code contains no known pass-through abstractions, duplicated registries, hidden fallback
  chains, or generic names covered by the approved rules;
- first-party god-files have been split into cohesive business units without creating file
  fragmentation;
- package and folder boundaries pass the second-caller-or-domain-concept test;
- generated, mirrored, framework-required, and buyer-delivery exceptions are explicit and checked
  for drift;
- focused gates and `pnpm verify` pass;
- no product behavior or public contract changed without separate approval.
