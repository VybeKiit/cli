# PayPal payments

Use the **PayPal MCP** server — not Playwright dashboard automation.

## Setup

1. Merge `templates/web/.vybekiit/agent/mcp-paypal.json` into the buyer MCP config (sandbox default).
2. Follow multi-client paths in `templates/web/.vybekiit/agent/mcp-setup.md` (Cursor, Claude Desktop, Codex).
3. Builder completes PayPal OAuth once when prompted on first MCP tool use.

When `PAYMENTS_PROVIDER=paypal`, agents provision via PayPal MCP, then write `PAYPAL_CLIENT_ID`, secrets, and webhook id to `.env`.

## Boundaries

| In scope | Out of scope |
|----------|--------------|
| PayPal remote MCP (sandbox → production URL swap) | Playwright dashboard automation in this package |
| Platform skill `paypal-vybekiit.md` | Runtime checkout (stays in `@vybekiit/payments`) |

## Upstream

- PayPal MCP quickstart: https://docs.paypal.ai/developer/tools/ai/mcp-quickstart
- Developer docs: https://developer.paypal.com/docs
