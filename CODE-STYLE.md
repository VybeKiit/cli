# CODE-STYLE.md — VybeKiit

This is the daily contract for authored code in `apps/`, `cli/`, `packages/`, `templates/`, and
`scripts/`. `code-style.rules.json` mirrors the rules and names each enforcement channel. Product
architecture belongs in `CONTEXT.md`; decisions and migration history belong in `docs/adr/`.

## Read code in one pass

A function should read as input → validation → business work → side effect → output.

- Use const-arrow functions. `function*` is allowed inside `Effect.gen`.
- Prefer guard clauses and flat control flow.
- Compute a complicated fact once, give it a domain name, then branch on that name.
- Never nest ternaries or hide decisions inside dense parenthesized expressions.
- Use an explicit loop for multi-step business filtering. Comment the business rule above the loop,
  not the mechanics of iteration.
- Local accumulators may mutate when ownership is obvious. Inputs, React state, and shared objects
  remain immutable.

```ts
const hasBillableSubscription = subscription.status === 'active' && subscription.plan !== 'free';
if (!hasBillableSubscription) {
  return Effect.fail(new BillingError({ code: 'subscription_required' }));
}
```

Not this:

```ts
return subscription.status === 'active'
  ? subscription.plan !== 'free'
    ? charge(subscription)
    : skip()
  : skip();
```

Rules: `control-flow.no-nested-ternary`, `control-flow.flat-conditions`.

## Name the domain value

- Name values for what they contain: `bodyRequest`, `checkoutResponse`, `selectedSurface`,
  `sessionTranscript`.
- Do not use `data`, `result`, `temp`, `manager`, `handleData`, or similar placeholders when a
  domain term exists.
- Boolean names state a positive fact: `isConnected`, `hasSelection`, `canRetry`.
- First-party files and folders use camelCase. React component files use PascalCase matching their
  export. Framework-reserved and mirrored vendor names keep their ecosystem convention.

```ts
const bodyRequest = await readRequestJson(request);
const checkoutResponse = await createCheckout(bodyRequest);
```

Rule: `naming.no-vague-local`.

## Absence and defaults

- Prefer `!value` when every falsy value is absent or invalid.
- Use an explicit type, null, or undefined check when `0`, `false`, or `''` is a legitimate value.
- Avoid routine `??` defaults and fallback chains. Apply defaults while decoding input or config.
- Missing internal registry entries and provider implementations fail clearly; they do not select a
  surprise default.

```ts
if (!selectedSurface) {
  return { ok: false, error: 'missing-surface' };
}

if (retryCount === undefined) {
  return ConfigError.missing('RETRY_COUNT');
}
```

Rule: `absence.explicit-boundary-defaults`.

## Real boundaries only

- An abstraction earns its place through a genuine domain concept or multiple real callers.
- Delete pass-through functions, single-implementation interfaces, and one-use wrappers without
  domain meaning.
- Keep one contract and one registry per concept. Derive types, prompts, help, configuration, and
  labels from it.
- Organize internals by capability. Do not create `helpers`, `common`, `misc`, or `managers` buckets.
- Split large files by business responsibility, not line count. Do not create one-export-per-file
  fragmentation.
- Package entrypoints are deliberate public surfaces. Do not use a root barrel to expose internals
  accidentally.
- Keep provider folders only for multiple real providers or a genuine provider boundary.

Rules: `architecture.real-boundaries`, `architecture.singular-contract`.

## Effect, I/O, and errors

Effect is the workflow model in maintained packages.

- Stay in `Effect` through the workflow and run it once at a composition edge.
- Keep network, filesystem, database, process, and browser operations visible at I/O edges.
- Expected failures use `Data.TaggedError` with a stable domain code.
- Unexpected defects remain defects. Do not swallow them or turn them into generic success values.
- Services and `Layer`s represent domain capabilities, not wiring ceremony.
- Never hand-roll provider selection at call sites or hide a missing provider behind a fallback.

Rules: `effect.visible-io`, `errors.typed-expected-failures`. See ADR-0018 and ADR-0023.

## Contracts and validation

- Decode untrusted input once with Effect Schema at HTTP, config, process, or storage boundaries.
- Internal functions receive trusted domain values and do not repeat speculative guards.
- Use `type` for unions and schema-derived values. Component prop contracts may use interfaces.
- Fields crossing a boundary are `readonly`.
- Prefer `unknown` to `any`. Cast only at a documented vendor seam.
- Use named exports. Framework-required default exports are the exception.

Rule: `validation.parse-once`.

## Comments and docs

- Comments explain a business constraint, compatibility reason, safety boundary, or surprising
  decision. Delete narration.
- Public and domain contracts receive useful TSDoc.
- Obvious internal functions do not receive boilerplate `@param`, `@returns`, or fabricated examples.
- Durable rationale belongs in an ADR or `CONTEXT.md`.

```ts
// A create command selects exactly one buyer surface; all other flags fail before scaffolding.
for (const argument of argumentsToParse) {
  // ...
}
```

Rule: `comments.business-reason`.

## UI and CLI edges

- UI composes kit primitives and design tokens. Repeated sibling options come from one registry and
  `.map()`.
- Multi-step UI events use named handlers.
- Fetch through the package or app boundary and render loading, error, empty, and success states.
- CLI commands share the same functions between interactive and non-interactive paths. Flags and
  non-TTY use never hang.
- CLI output uses `process.stdout` or `process.stderr`, not `console`.

See ADR-0034 for the CLI interaction contract.

## Tests

- Protect observable behavior before a structural refactor.
- Work red → green → refactor.
- Test business outcomes and public contracts, not private implementation shape.
- Colocate unit tests when practical. Keep integration and end-to-end suites in their dedicated
  directories.
- Extract a fixture only after multiple suites need the same setup.
- Run focused tests, typecheck, lint, and `pnpm check:code-style -- --files <changed files>` during a
  slice. Run `pnpm verify` before completing it.

Rule: `tests.behavior-first`.

## Generated, mirrored, and buyer-delivery code

Generated output, mirrored vendor components, framework-required files, and delivery-required
template copies are not examples of authored taste. Keep them isolated and cover their source or
synchronization path with a drift check. Each generated template must remain self-contained.

Exceptions are listed in `code-style.rules.json` and must stay narrow and named.

## Enforcement

- Biome owns formatting, imports, syntax, and machine-catchable lint rules.
- `scripts/dev/checks/checkCodeStyleRules.mjs` validates the rules catalog and checks focused authored
  files for repository-specific tells.
- Tests own behavior and singular-registry/contract drift.
- Review with `deslop` for readability and `deslop-v2` for abstractions that lack a second caller or
  domain meaning.
- Do not promote a warning to an error until its existing authored violations are removed or isolated
  as an explicit exception.

The full enforcement mapping lives in `code-style.rules.json`.
