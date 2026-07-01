# ADR-0024 — Supabase Auth as the default sign-in engine

- **Status:** Accepted
- **Date:** 2026-07-01
- **Deciders:** Yosef (owner)
- **Supersedes:** the default-provider decision in [ADR-0003](./0003-better-auth-provider.md)

## Context

ADR-0003 made **better-auth** the default auth adapter, bound to the builder's own database, and
explicitly rejected "Supabase Auth, always." Since then the default **data** stack is Supabase
(Postgres, ADR-0002). For a Supabase-backed app, running better-auth *on top of* Supabase Postgres
means an extra secret (`BETTER_AUTH_SECRET`), extra auth tables + migrations, and a second auth
system living beside the one Supabase already ships for free — more moving parts than the default
stack needs, against the non-coder KISS promise.

## Decision

1. **Add a `supabase` `AuthProvider`** (Supabase Auth / GoTrue) behind the *same* `AuthProvider`
   interface as better-auth and Cognito. It covers the full sign-in surface: password, email code,
   magic link, password reset, and SMS.
2. **Auth follows data when `AUTH_PROVIDER` is unset:** Supabase data → **Supabase Auth** (the new
   default), AWS → Cognito, MongoDB → better-auth-on-Mongo, other Postgres (Neon/Railway/Firebase) →
   better-auth, nothing configured → the local dev identity (ADR-0008).
3. **better-auth is demoted to the non-Supabase Postgres/Mongo stacks;** Cognito still serves AWS.
   All adapters stay behind the one interface — the `add-signin` skill and feature code never branch
   on the name.

## Consequences

- The default Supabase app gets **managed auth with no better-auth secret or tables** — fewer moving
  parts for the common case.
- better-auth remains for Neon/Railway/Mongo, so non-Supabase stacks keep a single self-hosted
  auth-and-data database (the ADR-0003 benefit, still intact where it applies).
- `AUTH_PROVIDER` gains a `supabase` value and **no longer hard-defaults**; unset means "follow
  data." The AWS→Cognito auto-routing from ADR-0003 is preserved.
- **New dependency:** `@supabase/supabase-js` in `@vybekiit/auth` (already shipped by `@vybekiit/db`,
  so no new third-party surface for the monorepo).

## Supersedes

Supersedes ADR-0003's decision that better-auth is *the* default. ADR-0003's interface shape (one
`AuthProvider`, swappable adapters, Cognito for AWS, one `add-signin` skill) still stands — only the
default adapter changes.
