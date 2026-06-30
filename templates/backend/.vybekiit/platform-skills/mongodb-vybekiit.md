# Platform wrapper: MongoDB Atlas (agent/maintainer only)

**Agent-only.** Not invoked by buyer `wire-database`. Use when `.env` already has `DATA_PROVIDER=mongodb`.

## Official upstream

- Docs: https://www.mongodb.com/docs/
- Node driver: https://www.mongodb.com/docs/drivers/node/current/
- Agent skills: https://www.mongodb.com/docs/agent-skills/
- Skills repo: https://github.com/mongodb/agent-skills
- MCP overview: https://www.mongodb.com/docs/mcp-server/overview/
- MCP get started: https://www.mongodb.com/docs/mcp-server/get-started/

## Kit wiring

1. Set `DATA_PROVIDER=mongodb`, `MONGODB_URI` (Atlas SRV connection string), and `MONGODB_DB` (database name)
2. Data access via `@vybekiit/db` → `resolveDataProvider()` in controllers/services — never direct driver in routes
3. Atlas CLI installed by `vybekiit doctor` when `DATA_PROVIDER=mongodb`

## MCP

Merge `.vybekiit/agent/mcp-mongodb.json` into buyer `.cursor/mcp.json` (see `agent/mcp-setup.md`).

1. Copy `MONGODB_URI` from `.env` into `MDB_MCP_CONNECTION_STRING`
2. Keep `MDB_MCP_READ_ONLY=true` unless a maintainer explicitly needs write tools
3. Fallback: `npx mongodb-mcp-server@latest setup` — see official get-started guide

If MCP fails once, run `vybekiit doc-fallback mongodb`.

## Verify-before-advance

- `pingDatabase()` from `@vybekiit/db` succeeds
- MCP lists collections on the dev cluster (read-only)
- Never connect MCP to production buyer data without read-only mode
