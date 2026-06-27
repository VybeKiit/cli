# ADR-0003 — better-auth as the auth provider (DB-bound)

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

Supabase bundled authentication for free, so "let people log in" had a backend the moment data did.
ADR-0002 widened data to `@vybekiit/db` adapters (`supabase`⭐/`mongodb`/`aws`) — but the new MongoDB
and AWS adapters bring **no built-in auth**. A buyer who picks Mongo or DynamoDB for data would have
"let people sign in" pointing at nothing.

We need one auth story that works regardless of which data adapter is active, without making the
builder run a Supabase project *just* for sign-in when their data lives elsewhere.

## Decision

1. **Refactor `@vybekiit/auth` to an `AuthProvider` interface** — the same one-interface,
   swappable-adapters shape as `@vybekiit/payments` and the ADR-0002 packages.
2. **Default adapter is better-auth, bound to the builder's chosen DB.** Auth tables live in the
   **same** database the builder's data uses — Postgres for the Supabase adapter, Mongo for the
   MongoDB adapter. No separate auth service.
3. **AWS-DynamoDB apps use Cognito** behind the same `AuthProvider` interface.
4. **One `add-signin` skill, three wirings.** The skill is written once against the interface; it
   wires better-auth-on-Postgres, better-auth-on-Mongo, or Cognito depending on the selected data
   adapter. The builder never hears any of those names.

## Consequences

- **New dependency: better-auth.** It replaces the implicit "auth = Supabase Auth" assumption. (What
  it is: a framework-agnostic, self-hosted auth library that stores its tables in your own DB. Why
  over alternatives: it binds to whatever Postgres/Mongo the data adapter already provisioned, so
  auth and data share one database — no extra service, no extra account.)
- **Auth + data share one database.** Simpler ops: one place to back up, one connection, no separate
  Supabase project spun up only for sign-in when data lives in Mongo or AWS.
- **Cognito is an extra wiring, not an extra surface.** It sits behind the same interface, so feature
  code and the `add-signin` skill don't branch on it.
- **Supersedes "auth = Supabase" in CONTEXT.** Auth is now an `AuthProvider` interface defaulting to
  DB-bound better-auth.

## Alternatives rejected

- **Supabase Auth, always, decoupled from the data adapter:** running a Supabase project purely for
  auth while data lives in Mongo or AWS is odd ops and a second account the builder doesn't need.
- **Native auth per backend (Lucia on Postgres, Cognito on AWS, Supabase Auth on Supabase):** three
  unrelated auth stacks behind one interface triples the maintenance and test surface for no buyer
  benefit — better-auth already spans Postgres and Mongo on its own.
