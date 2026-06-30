# Platform wrapper: Supabase (default data)

**Agent-only.** Invoked by buyer skills `save-data`, `doctor`, and prerequisites for `add-signin`.

## Official upstream

- Docs: https://supabase.com/docs
- Supabase MCP: https://supabase.com/docs/guides/ai-tools/mcp
- CLI: `supabase` (installed by `vybekiit doctor`)
- Pinned skills: `.agents/skills/supabase/SKILL.md`, `.agents/skills/supabase-postgres-best-practices/SKILL.md`

## Kit wiring

1. Merge `agent/mcp-supabase.json` into buyer MCP config — see `agent/mcp-setup.md` (Cursor, Claude Desktop, Codex)
2. Builder completes Supabase OAuth once when MCP prompts on first use
3. Data access via `@vybekiit/db` → `resolveDataProvider()` — never direct Supabase client in UI
4. After `supabase login`, agent runs programmatic project create (see `doctor` / onboarding)
5. Write `SUPABASE_URL`, `SUPABASE_ANON_KEY`, service role to `.env`
6. Migrations under `infra/`; RLS reviewed; service role server-side only
7. For auth: also set `DATABASE_URL` (Postgres connection) for better-auth — see `better-auth-vybekiit.md`

Optional: scope MCP URL with `?project_ref=…&read_only=true` per Supabase security guidance.

## Verify-before-advance

- MCP connected (list tables or run a read query)
- `supabase projects list` works after login
- `pingDatabase()` from `@vybekiit/db` succeeds
- Migration applied; test read/write path green
