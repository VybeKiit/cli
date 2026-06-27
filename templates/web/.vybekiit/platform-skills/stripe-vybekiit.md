# Platform wrapper: Stripe (opt-in payments)

**Agent-only.** Invoked by buyer skill `setup-payments` when `PAYMENTS_PROVIDER=stripe`.

## Official upstream

- Docs: https://docs.stripe.com
- API reference: https://docs.stripe.com/api

## Kit wiring

1. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` when `PAYMENTS_PROVIDER=stripe`
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and price/product ids in `.env`
3. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
4. Replace `TODO(vybekiit): … — skill: setup-payments` markers
5. **Note:** Stripe is not Merchant of Record — explain tax handling in plain words if the builder asks

## Verify-before-advance

- Test checkout opens; webhook receives `checkout.session.completed` (test mode OK)
- Order recorded; builder sees success in app
