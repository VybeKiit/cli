# Platform wrapper: testing (agent-only)

**Agent-only.** Run tests with every feature — the builder never hears "vitest" or "unit test."

## When

Every new feature, bug fix, API route change, or hook change.

## How

- **Runner:** `pnpm test` (Vitest)
- **Mobile:** React Native Testing Library where needed; test files live in `src/**/__tests__/`
- **Patterns:** follow existing tests in `src/lib/__tests__/`, `src/hooks/__tests__/`, `src/components/__tests__/`

## Rules

1. Test **behavior users care about** — form submit succeeds, auth error shows, checkout redirects.
2. No `toBeDefined()` theater — assert outcomes, not existence.
3. Mock network at the client boundary (`fetch-json`, auth/billing clients), not deep kit internals.
4. Run `pnpm test` **before** telling the builder something works.

## Also read

- `nextjs-vybekiit.md` — App Router + API route patterns
- `react-patterns-vybekiit.md` — hooks and forms to test

## Verify

```bash
pnpm test
```

Green before "done."
