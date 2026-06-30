# Platform wrapper: Stripe (opt-in payments)

**Agent-only.** Invoked by buyer skill `setup-payments` when `PAYMENTS_PROVIDER=stripe`.

## Official upstream

- Docs: https://docs.stripe.com
- API reference: https://docs.stripe.com/api
- Stripe MCP: https://docs.stripe.com/mcp
- Pinned skill: `.agents/skills/stripe-best-practices/SKILL.md`

## Kit wiring

1. Merge `agent/mcp-stripe.json` into buyer MCP config — see `agent/mcp-setup.md` (Cursor, Claude Desktop, Codex)
2. Builder completes Stripe OAuth once when prompted by MCP
3. Agent creates product + price via Stripe MCP write tools; write restricted `STRIPE_SECRET_KEY` and webhook secret to `.env`
4. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` when `PAYMENTS_PROVIDER=stripe`
5. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
6. Replace `TODO(vybekiit): … — skill: setup-payments` markers
7. **Note:** Stripe is not Merchant of Record — explain tax handling in plain words if the builder asks

## Verify-before-advance

- MCP connected; test mode product/price visible in Stripe
- Test checkout opens; webhook receives `checkout.session.completed` (test mode OK)
- Order recorded; builder sees success in app
