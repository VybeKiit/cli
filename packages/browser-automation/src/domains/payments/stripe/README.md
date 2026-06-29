# Stripe payments

Use the **Stripe MCP** server — not Playwright dashboard automation.

## Setup

1. Merge `templates/web/.vybekiit/agent/mcp-stripe.json` into the buyer MCP config.
2. Follow multi-client paths in `templates/web/.vybekiit/agent/mcp-setup.md` (Cursor, Claude Desktop, Codex).
3. Builder completes Stripe OAuth once when prompted by MCP.

When `PAYMENTS_PROVIDER=stripe`, agents create products and prices via Stripe MCP write tools, then write restricted keys to `.env`.

## Boundaries

| In scope | Out of scope |
|----------|--------------|
| Stripe MCP onboarding (products, prices, webhooks) | Playwright dashboard automation in this package |
| Platform skill `stripe-vybekiit.md` | Runtime checkout (stays in `@vybekiit/payments`) |

## Upstream

- Stripe MCP: https://docs.stripe.com/mcp
- API: https://docs.stripe.com/api
