# Platform wrapper: Lemon Squeezy (default payments)

**Agent-only.** Invoked by buyer skill `setup-payments`.

## Official upstream

- Docs: https://docs.lemonsqueezy.com

## Kit wiring

1. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` (LS when `PAYMENTS_PROVIDER` default)
2. Set `PAYMENTS_PROVIDER=lemon-squeezy`, store + variant IDs, `LEMONSQUEEZY_API_KEY`, webhook secret in `.env`
3. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
4. Replace `TODO(vybekiit): … — skill: setup-payments` markers

## Verify-before-advance

- Test checkout opens; webhook receives event (test mode OK)
- Order recorded in database; builder sees success in app
