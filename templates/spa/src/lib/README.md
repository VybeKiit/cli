# `src/lib/` — utility registry (agent-only)

| File | Owns |
|---|---|
| `api-client.ts` | Typed fetch to the backend (`VITE_PUBLIC_APP_URL`) |
| `client-state.tsx` | TanStack Query provider via `@vybekiit/client-state` |
| `i18n.tsx` | Flat `messages/*.json` lookup for SPA |
| `logger.ts` | Structured logging via `@vybekiit/core` |
| `realtime-client.ts` | `@/vybekiit/realtime` provider resolution |
| `utils.ts` | UI helpers only (`cn`) |
