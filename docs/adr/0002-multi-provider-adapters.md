# ADR-0002 — Multi-provider adapters for data, hosting, storage, and email

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

The original blueprint locked a single stack: Supabase for data + auth, Cloudflare for
hosting + email, and AWS **explicitly dropped** (bill-shock + non-coder-hostile). That kept the
surface tiny but left the kit unable to serve a buyer who arrives with — or grows into — a
MongoDB or AWS world.

`@vybekiit/payments` already proved the way out: **one interface, swappable adapters, one default**
(`PaymentProvider` with `lemon-squeezy`⭐/`stripe`/`paypal`). The agent reads one `.env` setting and
routes; the builder never picks. A grill decided to widen support by applying that same proven
pattern to every infrastructure concern, without changing the defaults the rest of the kit relies on.

## Decision

1. **Data: `@vybekiit/db` becomes a `DataProvider` interface** with adapters
   `supabase`⭐ (Postgres), `mongodb` (Atlas), and `aws` (DynamoDB/DocumentDB). Supabase stays the
   default; the others are opt-in escape hatches.
2. **Hosting: a new `@vybekiit/deploy` package** with a `Hosting` interface, adapters
   `cloudflare`⭐ and `aws` (Amplify or SST). Cloudflare stays the default.
3. **Storage: a `StorageProvider` interface** (in `@vybekiit/db` or its own package), adapters
   `supabase`/`R2`⭐ and `s3`.
4. **Email: `@vybekiit/email` becomes an `EmailProvider` interface** with adapters
   `cloudflare`⭐, `ses`, and `resend`.
5. **The builder never picks a provider.** The agent reads **one** setting in `.env` and routes to
   the right adapter. Skills stay **goal-named, never tech-named** — "save my data" wires whichever
   DB adapter is selected; the vibe coder never hears "MongoDB" or "AWS".
6. **Skills are written once, against the interface.** Adding a provider adds an adapter, never a
   skill.

## Consequences

- **Defaults are unchanged.** Supabase + Cloudflare still ship as the out-of-the-box stack, so
  ADR-0001's toolchain (`supabase` + `wrangler`) still governs the **default** path. MongoDB/AWS are
  "also supported," not "the new stack."
- **More maintenance surface.** Each adapter is real drift + its own tests; an AWS or Mongo SDK
  change can break an adapter without touching the default. This is the explicit cost of breadth.
- **AWS console complexity is absorbed by the agent, never shown.** The whole point — even when the
  AWS adapter is active, the builder follows the same plain-language steps and never sees a console.
- **Supersedes the "AWS dropped" and "Supabase-only data" stances in CONTEXT.** Those become "AWS is
  an opt-in adapter" and "Supabase is the default data adapter." ADR-0001 still governs the default
  toolchain.

## Alternatives rejected

- **Keep the single stack** (Supabase + Cloudflare only): smallest surface, but the owner wants
  breadth — buyers who already live in Mongo or AWS would be turned away.
- **Replace the stack with Mongo/AWS:** throws away Supabase's batteries-included wins (auth,
  storage, instant Postgres) and adopts the most non-coder-hostile cloud as the *default* — the exact
  thing the original blueprint dropped.
- **Let the builder pick the provider:** violates Decide + Guide. The builder describes a goal; the
  agent decides the backend. A provider menu is a technical decision we exist to remove.
