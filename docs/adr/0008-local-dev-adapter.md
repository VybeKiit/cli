# ADR-0008 — Local dev adapter (zero-config fallback for data + auth)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Yosef (owner), via `/grill-with-docs` "finish open issues" session

## Context

`templates/web` (OWNED, frozen) ships its auth and billing logic as `TODO(vybekiit)` stubs in
`lib/auth-client.ts` and `lib/billing-client.ts`, which the buyer's agent wires per the chosen
backend via the `add-signin` / `setup-payments` skills. The real `DataProvider` / `AuthProvider`
adapters all require live secrets (Supabase URL + keys, a Postgres `DATABASE_URL`, Cognito IDs).

This collides with the **keystone** (CONTEXT.md): *the buyer's app is LIVE in session #1* and the
onboarding "aha" is a running app. On a freshly scaffolded repo there is no `.env` yet, so the very
first `pnpm dev` resolves a provider whose config parse **throws** — the screens are dead and the
first impression is "broken," the exact refund-trap the kit is designed to avoid.

We also need the reference app to be **clickable and testable offline** (no accounts) so #6 web
screens, the onboarding demo, and CI can exercise the real critical path without any secret.

## Decision

1. **Add a `local` adapter to both `@vybekiit/db` and `@vybekiit/auth`** — MAINTAINED, headless,
   shipped via npm like every other adapter. It does **not** live in the template (that would
   duplicate across web/mobile/extension and break "adding a provider never adds a skill").
2. **`local` is the implicit no-secrets fallback, not a named choice the buyer picks.**
   - `resolveDataProvider`: when `DATA_PROVIDER` is unset **and** no backend secrets are present,
     return the `local` provider; otherwise resolve the configured backend exactly as today.
   - `resolveAuthProvider`: same rule — `local` auth when nothing is configured, else the existing
     better-auth/Cognito resolution (ADR-0003) is untouched.
   - An explicit `DATA_PROVIDER`/`AUTH_PROVIDER` always wins; the fallback only fills the empty case.
3. **Storage:** in-memory, zero dependency. `local` data is a per-process `Map`; `local` auth
   returns a single fixed dev user and accepts any OTP / any password (clearly a dev identity).
   **Data resets on restart** — chosen deliberately: it is honest signal that this is temporary and
   a real backend should be wired, and it keeps the zero-config promise (no native build, no file).
4. **Voice:** the buyer never hears "local adapter." `language.md` frames it as *"practice data on
   your computer"* / *"a starter sign-in just for you while we build"*; `add-signin` and `save-data`
   narrate the swap to a real backend as *"now your app remembers things for real."*
5. **Tests:** the `local` adapter is the contract-conformance fixture for the `DataProvider` /
   `AuthProvider` interfaces (it needs no network), and the substrate that lets #6 screen tests and
   the onboarding dry-run run without secrets.

## Consequences

- A fresh `vybekiit new web` → `pnpm dev` **runs**: sign-in works with the dev user, the dashboard
  renders, "save data" persists for the session. The keystone demo is real before any account exists.
- The default *configured* path is unchanged: set Supabase keys (or pick any adapter) and resolution
  behaves exactly as ADR-0002/0003 specify. `local` is invisible once a backend is wired.
- One more adapter to maintain per interface — but it is dependency-free and stable (no vendor SDK
  drift), so its maintenance surface is near zero, unlike the AWS/Mongo adapters (ADR-0002 watch).
- In-memory means **no persistence across restarts**; if a buyer ever wants local persistence we
  revisit (SQLite/JSON were considered and rejected here for zero-config purity).
- The `add-signin` / `save-data` / `setup-payments` skills gain an explicit "you're on practice data
  now — here's how we make it real" first step, reinforcing verify-before-advance.
