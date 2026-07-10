# Platform wrapper: observability (agent-only)

**Agent-only.** Logging and error tracking wiring — not a buyer goal skill.

## Structured logging

- Import `log` from `src/lib/logger.ts` (wraps `@vybekiit/core` `createLogger`).
- **Development:** `debug` and `info` print automatically.
- **Production:** only `warn` and `error` print — no builder configuration needed.
- Optional override: `LOG_LEVEL` in `.env` (agent-only; never ask the builder to set it).
- API routes: `const routeLog = log.child({ requestId })` when correlating a request.

```ts
import { log } from '@/lib/logger';

log.info('Contact form accepted', { email: parsed.data.email });
log.error('Checkout failed', err);
```

Never use bare `console.log` in `app/` or `src/` (tests excluded).

## Error tracking

- Buyer skill: `track-errors` — wires `@vybekiit/observability`.
- Server entry: `instrumentation.ts` calls `resolveObservabilityProvider`.
- App code: `import { observability } from '@/lib/observability'` then `observability.captureException(err)`.
- Platform wrapper: `sentry-vybekiit.md` for Sentry dashboard steps.

## Pre-ship checks

```bash
node scripts/checkNoConsole.mjs
rg "from '@/lib/logger'" app/api/
```

See `check-safety` step 6 (code readiness) and `go-live` pre-flight.
