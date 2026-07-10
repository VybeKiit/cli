# Platform wrapper: Neon (serverless Postgres)

**Agent-only.** Invoked by buyer skills `save-data`, `doctor`, and prerequisites for `add-signin`.

## Official upstream

- Docs index: https://neon.com/docs/llms.txt
- Quick setup: `npx neonctl@latest init` (maintainer OAuth — not buyer-facing)
- Agent skills: https://github.com/neondatabase/agent-skills

## Kit wiring

1. Set `DATA_PROVIDER=neon` and `DATABASE_URL` (Neon pooled connection string)
2. Data access via `@vybekiit/db` → `resolveDataProvider()` — never direct SQL in UI
3. Auth: `better-auth` uses the same `DATABASE_URL` Postgres binding
4. Migrations via Neon branching in dev only (never production MCP)

## MCP

Merge `.vybekiit/agent/mcp-neon.json` into buyer `.cursor/mcp.json`. Maintainer adds `Authorization: Bearer $NEON_API_KEY` or uses OAuth via `neonctl init`.

Fallback for clients without Streamable HTTP:

```bash
npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY
```

## Verify-before-advance

- `pingNeonDatabase(DATABASE_URL)` or doctor `pingDatabase()` green
- Neon MCP is **dev/IDE only** — never connect agents to production databases
