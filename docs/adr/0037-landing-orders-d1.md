# ADR-0037: The landing records orders in Cloudflare D1

## Status

Accepted.

## Context

The store's money pipeline (payment webhook → the GitHub gate; ADR-0033) persisted nothing: it
verified the signature, invited or removed the buyer's GitHub account, and returned. Lemon Squeezy's
dashboard was the only record of who bought. For our own customers we want a queryable ledger — an
admin list, refund auditing, webhook idempotency, and a name/email/GitHub trail — without standing up
new infrastructure or credentials.

The landing runs on Cloudflare Workers via OpenNext, so **Cloudflare D1 is co-located** (a binding, no
extra service, no new secret). `packages/db/presets/orders` already defines the canonical `orders`
shape, but that preset targets a *buyer's* chosen `DataProvider` (Supabase/Neon/Railway) for the apps
they build — a different concern from VybeKiit's own store. Separately, the buyer already types their
name once at Lemon Squeezy's hosted checkout; adding name fields to our deliberately minimal
`github + email` form would force double entry and add funnel friction.

## Decision

1. **The landing records every order in a D1 database `vybekiit`** (binding `DB`, id
   `40ddaa57-…`) — one `orders` table, migration in `apps/landing/migrations`. The shape mirrors the
   `packages/db/presets/orders` SSOT, trimmed to what the GitHub gate needs (drops
   `license_key`/`activated_at`/`revoked` — there is no license-key fulfilment) and **adds
   `first_name` / `last_name`**.
2. **The buyer name comes from the provider webhook, not our form.** The normalized `OrderEvent` gains
   `customerName` (Lemon Squeezy `user_name`, Stripe billing/customer name, PayPal given + surname);
   `apps/landing/src/lib/orders.ts` splits it on the first space (first token → first name, remainder →
   last name) on write. No checkout-form change — no double entry, no added friction.
3. **Persistence is best-effort and never blocks the gate.** `recordOrderBestEffort` returns a boolean
   the webhook echoes as `recorded` (visible in the provider's webhook logs); a missing binding (e.g. a
   run without Cloudflare bindings) or a failed write returns `false`, and the invite/remove still runs.
   Lemon Squeezy stays the source of truth for payments.
4. **`order_id` is `UNIQUE` and writes upsert on it**, so a redelivered webhook updates the row rather
   than duplicating — idempotency for free.
5. **Scope: this is VybeKiit's own store datastore.** Buyer apps still choose their datastore through
   `packages/db`; D1 is not (yet) a `packages/db` provider.

## Consequences

- A paid or refunded order lands in D1 keyed by `order_id` with the buyer's name/email/GitHub and a
  refund flag; the webhook response now carries `recorded`.
- The deployed Worker reads the binding via `getCloudflareContext().env.DB`; local dev sees it through
  the existing `initOpenNextCloudflareForDev()` in `next.config.mjs`. Migrations apply with
  `wrangler d1 migrations apply vybekiit` (or `d1 execute --file` for a one-off).
- `OrderEvent.customerName` is additive and nullable — every adapter sets it and no existing consumer
  changes behaviour.
- Deferred, deliberately: observability on a failed persist (today only the `recorded` flag signals it),
  and promoting D1 to a first-class `packages/db` provider if a buyer wants Cloudflare-native storage.
