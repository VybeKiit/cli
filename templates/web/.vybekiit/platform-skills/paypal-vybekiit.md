# Platform wrapper: PayPal (opt-in payments)

**Agent-only.** Invoked by buyer skill `setup-payments` when `PAYMENTS_PROVIDER=paypal`.

## Official upstream

- Docs: https://developer.paypal.com/docs
- PayPal MCP: https://docs.paypal.ai/developer/tools/ai/mcp-quickstart

## Kit wiring

1. Merge `agent/mcp-paypal.json` into buyer MCP config — see `agent/mcp-setup.md` (Cursor, Claude Desktop, Codex)
2. Builder completes PayPal OAuth once when MCP prompts (sandbox endpoint by default)
3. Agent provisions products/invoices via PayPal MCP write tools as needed
4. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` when `PAYMENTS_PROVIDER=paypal`
5. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and webhook id in `.env`
6. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
7. Replace `TODO(vybekiit): … — skill: setup-payments` markers
8. Switch MCP URL to production (`https://mcp.paypal.com/http`) only after sandbox checkout verified

## Verify-before-advance

- MCP connected; sandbox tool call succeeds
- Test checkout completes in sandbox; webhook fires
- Order recorded; builder sees success in app
