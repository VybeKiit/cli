# ADR-0017 — Railway coupled stack adapter

- **Status:** Accepted
- **Date:** 2026-06-30
- **Deciders:** Yosef (owner), via `/grill-with-docs` session

## Context

Railway ships a CLI, local MCP (`railway mcp`), remote MCP (`mcp.railway.com`), and the `use-railway`
agent skill. The backend `go-live` skill already mentions Railway as a host option, but VybeKiit had
no adapter, doctor wiring, or platform wrappers.

A grill session locked: **add Railway as opt-in coupled stack** — `HOSTING_PROVIDER=railway` plus
`DATA_PROVIDER=railway` on one Railway project — with CLI-native auth, both MCP snippets, doctor
auto-running `railway setup agent -y`, and web/backend template wiring. Cloudflare + Supabase remain
defaults.

## Decision

1. **Extend `@vybekiit/deploy`** with a `railway` adapter (`railway up --detach` via injectable runner).
2. **Extend `@vybekiit/db`** with a `railway` Postgres adapter (same jsonb contract as Neon).
3. **Extend enums:** `HOSTING_PROVIDER` adds `railway`; `DATA_PROVIDER` adds `railway`.
4. **Config:** `railwayHostingConfigSchema` — optional `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`;
   `railwayConfigSchema` — `DATABASE_URL` from Railway variables. No API token in `.env` (ADR-0001).
5. **`vybekiit doctor`** installs `@railway/cli`, probes `railway whoami`, omits Supabase CLI when
   `DATA_PROVIDER=railway`, warns on misconfigured coupling, and runs `railway setup agent -y` when
   the Railway stack is active.
6. **MCP:** ship `mcp-railway-local.json` (stdio) and `mcp-railway-remote.json` (OAuth URL); agent
   picks per task.
7. **Skills:** pin `use-railway` from `railwayapp/railway-skills`; wrappers
   `deploy-railway-vybekiit.md` and `railway-postgres-vybekiit.md`. No new buyer skill.
8. **Templates:** web + backend only (not mobile/extension in v1).

## Consequences

- Coupled-stack buyers get `[gh, railway]` — no Supabase CLI unless they switch data provider.
- Doctor may run Railway's setup command on the buyer machine — idempotent per Railway docs.
- One more hosting + data adapter pair to maintain — accepted cost of breadth.
- ADR-0002 lists updated conceptually: hosting adds Railway; data adds Railway Postgres.
