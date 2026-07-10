# Platform wrapper: code hygiene (agent-only)

**Agent-only.** Invisible guardrails for every coding task — not a buyer goal skill.

## Before you write code

1. **Check before create** — search `src/lib/` and `@vybekiit/*` before adding a helper; extend existing code if ≥80% overlap.
2. **One home per concern** — auth → `auth-client.ts`, billing → `billing-client.ts`, HTTP → `fetch-json.ts`, logging → `logger.ts`. Never add `utils-foo.ts`.
3. **Use the kit logger** — `import { log } from '@/lib/logger'` (web) or `@/lib/logger` (mobile). Never `console.log` in app/API code (tests may use console).
4. **KISS** — no one-off wrappers around kit packages; validate API bodies with zod at the route boundary only.
5. **SSOT** — secrets in `.env` only; business constants in one file per domain (e.g. `plans.ts`).

Read `src/lib/README.md` for the utility registry.

## Duplicate detection

Before adding a function:

```bash
rg "function <name>" src/lib/ app/
rg "export (async )?function" src/lib/
```

Flag and merge when the same name or a 10+ line block appears twice. Consolidate validation into shared zod schemas, not copy-pasted checks in routes.

## Forbidden

- Second auth/billing/fetch wrapper
- Inline date/currency formatters in components (add to an existing lib file)
- Raw SQL or string-built queries (use `@vybekiit/db`)

## React-specific

Follow pinned `vercel-react-best-practices` for event-listener dedup, RSC prop dedup, and effect placement.

## Verify

After refactors: tests green · `node scripts/checkNoConsole.mjs` (web) · no duplicate function names in `src/lib/`.
