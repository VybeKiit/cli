# Platform wrapper: format + lint (agent-only)

**Agent-only.** Keep the codebase tidy — the builder never runs the linter or formatter.

## When

After every substantive edit; once after first `pnpm install` during onboarding (quality smoke).

## How

```bash
pnpm format    # biome check --write .
pnpm lint      # biome check .
```

Or the full loop:

```bash
pnpm quality   # format → lint → typecheck → test
```

Optional agent wrapper: `node scripts/check-quality.mjs`

## Rules

1. **Never ask the builder** to run lint or format — you do it silently.
2. Biome **warn** rules (function length, complexity) are soft — fix obvious ones; don't block ship on style warnings unless egregious.
3. If lint fails on a real error, fix it and re-run. Translate one plain fix if you must mention something to the builder (rare).
4. **Pre-push only** — buyer templates ship an identical husky **pre-push** hook (not pre-commit). The builder never pushes; the agent does. The hook runs `pnpm quality` before push succeeds.

## Verify

`pnpm lint` exits 0 (warnings OK). Full smoke: `pnpm quality`.
