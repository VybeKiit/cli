# Platform wrapper: Railway deploy (opt-in host)

**Agent-only.** Invoked by buyer skill `go-live` when `HOSTING_PROVIDER=railway`.

## Official upstream

- Docs: https://docs.railway.com
- CLI: `railway` (installed + probed by `vybekiit doctor` when Railway hosting is selected)
- Agent skill: `use-railway` in `.agents/skills/` (pinned from railwayapp/railway-skills)
- MCP: merge `mcp-railway-local.json` or `mcp-railway-remote.json` per task

## Kit wiring

1. Set **coupled stack** in `.env`: `HOSTING_PROVIDER=railway` and `DATA_PROVIDER=railway` (agent decides — builder never picks hosts)
2. Run `vybekiit doctor` — installs `railway`, runs `railway setup agent -y`, checks auth
3. Call `resolveHosting()` from `@vybekiit/deploy` — returns Railway adapter
4. Supply a `RailwayRunner` that executes the adapter's railway action (go-live skill owns the shell)
5. Optional secret settings after link: `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`
6. CLI auth: `railway login` (browser flow) — no token in `.env` (ADR-0001)

## Verify-before-advance

- `railway whoami` succeeds
- `railway link` completed in project directory
- Deploy returns live service URL
- Open URL before celebrating
