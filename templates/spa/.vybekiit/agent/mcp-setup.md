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

Use `codex mcp add` interactively, or add TOML tables manually for HTTP MCP servers (Stripe, Supabase, Neon).

Restart Codex after changes. Run `/mcp` in a session to verify tools are listed.

## Provider snippets (merge when the skill needs them)

| When | File | Upstream docs |
|------|------|---------------|
| Data on backend (`DATA_PROVIDER=supabase`) | `mcp-supabase.json` | https://supabase.com/docs/guides/ai-tools/mcp |
| Stripe payments (backend) | `mcp-stripe.json` | https://docs.stripe.com/mcp |
| Neon data | `mcp-neon.json` | https://neon.tech/docs/ai/neon-mcp-server |
| Sentry error alerts | `mcp-sentry.json` | https://mcp.sentry.dev/mcp |
| PostHog analytics / flags | `mcp-posthog.json` | https://mcp.posthog.com/mcp |

Copy `mcp-*.json` fragments from the **web** or **backend** template when a skill needs them — the SPA itself has no local copies until synced.

### MCP failure → official docs

If an MCP server fails to connect or a tool call errors **once**, do not retry blindly:

1. Run `vybekiit doc-fallback <tech-id>` (e.g. `supabase`, `stripe`, `sentry`).
2. Follow the returned official URLs and env key hints.
3. Tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."* Never say MCP, stack trace, or provider jargon aloud.

Never connect MCP to production buyer data without `read_only=true` or a dev branch.
