# `src/lib/` — utility registry (agent-only)

Read this **before** adding a helper. Extend an existing file when it already covers ≥80% of the need.

| File | Owns |
|---|---|
| `auth-client.ts` | Sign-in, session, account API calls to the backend |
| `billing-client.ts` | Checkout, plans, payment API calls |
| `config.ts` | Backend URL (`EXPO_PUBLIC_APP_URL`) — the one address setting |
| `fetch-json.ts` | All backend HTTP — never hand-roll `fetch` in screens |
| `logger.ts` | All app logging |
| `plans.ts` | Plan/pricing constants |

**Rules:** one home per concern · no duplicate wrappers · no `console.log` in app code (use `logger.ts`).
