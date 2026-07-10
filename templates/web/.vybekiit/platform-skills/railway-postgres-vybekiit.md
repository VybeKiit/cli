# Platform wrapper: Railway Postgres (coupled stack data)

**Agent-only.** Invoked by buyer skills `save-data`, `doctor`, and prerequisites for `add-signin` when `DATA_PROVIDER=railway`.

## Official upstream

- Docs: https://docs.railway.com/databases/postgresql
- Agent skill: `use-railway` in `.agents/skills/`
- MCP: `mcp-railway-local.json` (variables, provisioning) or `mcp-railway-remote.json` (OAuth)

## Kit wiring

1. Set `DATA_PROVIDER=railway` with `HOSTING_PROVIDER=railway` (coupled stack — same Railway project)
2. Provision Postgres plugin in the linked Railway project via MCP or CLI
3. Pull `DATABASE_URL` from Railway variables into `.env`
4. Data access via `@vybekiit/db` → `resolveDataProvider()` — never direct SQL in UI
5. Auth: `better-auth` uses the same `DATABASE_URL` Postgres binding

## Verify-before-advance

- `pingRailwayDatabase(DATABASE_URL)` or doctor `pingDatabase()` green
- Railway MCP connected for variable reads in dev/IDE only
