# MCP setup — Cursor, Claude Desktop, Codex (agent-only)

Merge provider snippets from `.vybekiit/agent/mcp-*.json` into the buyer's AI client config. **Preserve existing servers** — never replace the whole file.

## Cursor

**Config:** project `.cursor/mcp.json` or global `~/.cursor/mcp.json`

1. Open the config file (create with `{ "mcpServers": {} }` if missing).
2. Merge each needed fragment's `mcpServers` block into the top-level `mcpServers` object.
3. Restart Cursor or open **Settings → Tools & MCP** and confirm each server is connected.

## Claude Desktop

**Config (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`

Same JSON shape as Cursor — merge `mcpServers` entries from the snippets below. Restart Claude Desktop after saving.

## Codex

**Config:** `~/.codex/config.toml` or project `.codex/config.toml` (trusted projects only)

Use `codex mcp add` interactively, or add TOML tables manually:

### HTTP MCP (Stripe, Supabase, Neon)

```toml
[mcp_servers.stripe]
url = "https://mcp.stripe.com"

[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp"

[mcp_servers.neon]
url = "https://mcp.neon.tech/mcp?readonly=true"
```

### Stdio bridge (PayPal remote)

PayPal uses `mcp-remote` because the hosted server requires streamable HTTP via a local bridge:

```toml
[mcp_servers.paypal]
command = "npx"
args = ["-y", "mcp-remote", "https://mcp.sandbox.paypal.com/http"]
```

Production PayPal: replace sandbox URL with `https://mcp.paypal.com/http`.

### Stdio (Firebase, MongoDB)

```toml
[mcp_servers.firebase]
command = "npx"
args = ["-y", "firebase-tools@latest", "mcp"]

[mcp_servers.mongodb]
command = "npx"
args = ["-y", "mongodb-mcp-server@latest"]

[mcp_servers.mongodb.env]
MDB_MCP_CONNECTION_STRING = "<copy from MONGODB_URI in .env>"
MDB_MCP_READ_ONLY = "true"
```

Restart Codex after changes. Run `/mcp` in a session to verify tools are listed.

## Provider snippets (merge one or more)

| When | File | Upstream docs |
|------|------|---------------|
| Default data (`DATA_PROVIDER=supabase`) | `mcp-supabase.json` | https://supabase.com/docs/guides/ai-tools/mcp |
| Stripe payments | `mcp-stripe.json` | https://docs.stripe.com/mcp |
| PayPal payments | `mcp-paypal.json` | https://docs.paypal.ai/developer/tools/ai/mcp-quickstart |
| Neon data | `mcp-neon.json` | https://neon.tech/docs/ai/neon-mcp-server |
| Firebase data | `mcp-firebase.json` | Firebase MCP via `firebase-tools mcp` |
| UI catalog | `mcp-ui-catalog.json` | VybeKiit local catalog |
| Twilio SMS / Verify | `mcp-twilio-docs.json` | https://mcp.twilio.com/docs |
| Twilio API (optional alpha) | `mcp-twilio-alpha.json` | `@twilio-alpha/mcp` stdio bridge |
| Sentry error alerts | `mcp-sentry.json` | https://mcp.sentry.dev/mcp |
| PostHog analytics / flags | `mcp-posthog.json` | https://mcp.posthog.com/mcp |
| Advanced data (`DATA_PROVIDER=mongodb`, **agent/maintainer only**) | `mcp-mongodb.json` | https://www.mongodb.com/docs/mcp-server/get-started/ |

### MCP failure → official docs

If an MCP server fails to connect or a tool call errors **once**, do not retry blindly:

1. Run `vybekiit doc-fallback <tech-id>` (e.g. `twilio`, `supabase`, `stripe`).
2. Follow the returned official URLs and env key hints.
3. Tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."* Never say MCP, stack trace, or provider jargon aloud.

See `.vybekiit/agent/tech-references.md` for the full id → docs map.

### Supabase optional query params

Append to the URL for tighter scope (recommended for real data):

- `?project_ref=<ref>` — limit to one project
- `?read_only=true` — Postgres read-only user
- Combined: `https://mcp.supabase.com/mcp?project_ref=abc123&read_only=true`

OAuth login happens on first use — no PAT required for interactive clients.

### PayPal OAuth

First tool call opens PayPal login in the browser. Use sandbox endpoint until checkout is verified, then switch to production URL in config.

## Advanced (CI / local only)

- **PayPal local:** `npx -y @paypal/mcp --tools=all` with `PAYPAL_ACCESS_TOKEN` — see PayPal MCP quickstart
- **Supabase CI:** PAT in `Authorization` header — see Supabase MCP security docs

Never connect MCP to production buyer data without `read_only=true` or a dev branch.

### MongoDB (agent/maintainer only)

When `.env` has `DATA_PROVIDER=mongodb`, merge `mcp-mongodb.json` and copy `MONGODB_URI` into `MDB_MCP_CONNECTION_STRING`. Keep `MDB_MCP_READ_ONLY=true` unless a maintainer explicitly needs write tools.
