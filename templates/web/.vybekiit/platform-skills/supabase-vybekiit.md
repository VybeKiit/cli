# Platform wrapper: Supabase (default data)

**Agent-only.** Invoked by buyer skills `save-data`, `doctor`, and prerequisites for `add-signin`.

## Official upstream

- Docs: https://supabase.com/docs
- CLI: `supabase` (installed by `vybekiit doctor`)

## Kit wiring

1. Data access via `@vybekiit/db` → `resolveDataProvider()` — never direct Supabase client in UI
2. After `supabase login`, agent runs programmatic project create (see `doctor` / onboarding)
3. Write `SUPABASE_URL`, `SUPABASE_ANON_KEY`, service role to `.env`
4. Migrations under `infra/`; RLS reviewed; service role server-side only
5. For auth: also set `DATABASE_URL` (Postgres connection) for better-auth — see `better-auth-vybekiit.md`

## Verify-before-advance

- `supabase projects list` works after login
- `pingDatabase()` from `@vybekiit/db` succeeds
- Migration applied; test read/write path green
