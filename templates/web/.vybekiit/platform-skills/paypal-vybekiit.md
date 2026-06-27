# Platform wrapper: PayPal (opt-in payments)

**Agent-only.** Invoked by buyer skill `setup-payments` when `PAYMENTS_PROVIDER=paypal`.

## Official upstream

- Docs: https://developer.paypal.com/docs

## Kit wiring

1. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` when `PAYMENTS_PROVIDER=paypal`
2. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and webhook id in `.env`
3. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
4. Replace `TODO(vybekiit): … — skill: setup-payments` markers

## Verify-before-advance

- Test checkout completes in sandbox; webhook fires
- Order recorded; builder sees success in app
