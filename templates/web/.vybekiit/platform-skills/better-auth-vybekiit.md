# Platform wrapper: better-auth (default auth)

**Agent-only.** Invoked by buyer skill `add-signin`.

## Official upstream

- Docs: https://www.better-auth.com/docs

## Kit wiring

1. Requires database first — run `save-data` / `supabase-vybekiit.md` if not ready
2. Auth via `@vybekiit/auth` → `resolveAuthProvider()` (better-auth when `AUTH_PROVIDER` default)
3. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL` in `.env` (agent generates secrets)
4. Mount handler at `app/api/auth/[...all]/route.ts`
5. Wire `src/lib/auth-client.ts` stubs marked `TODO(vybekiit): … — skill: add-signin`

## Verify-before-advance

- Sign-up → verify (OTP) → dashboard path works in browser
- Tests for auth client green
