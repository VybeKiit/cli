# `src/lib/` — utility registry (agent-only)

Read this **before** adding a helper. Extend an existing file when it already covers ≥80% of the need.

| File | Owns |
|---|---|
| `auth-client.ts` | Sign-in, session, account APIs |
| `auth-session.ts` | Server session cookie helpers |
| `billing-client.ts` | Checkout, plans, payment API calls |
| `fetch-json.ts` | Typed fetch + shared error shape |
| `fulfillment.ts` | Post-purchase fulfillment hooks |
| `logger.ts` | All app/API logging (`log.debug`, `log.info`, …) |
| `plans.ts` | Plan/pricing constants |
| `providers.ts` | Server provider resolution (`getAnalytics`, `getCms`, …) |
| `api-security.ts` | `@vybekiit/security` adapter for Next middleware |
| `utils.ts` | UI helpers only (`cn`) — not business logic |
| `direction.ts` | RTL / locale direction helpers |

**Rules:** one home per concern · no duplicate wrappers · no direct debug output in app code (use `logger.ts`).
