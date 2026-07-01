# ADR-0020 — Relational DB feature presets (Postgres-first)

- **Status:** Accepted
- **Date:** 2026-06-30
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

VybeKiit shipped a vendor-neutral `DataProvider` with runtime agent-defined schemas
(`save-data` skill). Only the store `orders` table had a checked-in migration. SaaS
features (teams, search, webhooks, AI history, audit logs) required buyers to hand-roll
SQL or rely on ad-hoc `plan-data-model` output.

Neon and Railway adapters used a single jsonb document table (`vybekiit_data`), which
could not enforce PK/FK or meaningful indexes for kit-owned features.

## Decision

1. **Composable DB feature presets** — each kit feature ships a manifest (entities,
   relations, indexes with `reason`, RLS mode) under `packages/db/presets/<feature>/`.
2. **Postgres-first relational DDL** — Supabase, Neon, and Railway render and apply real
   tables with PK/FK. Preset tables route through native SQL in Neon/Railway adapters;
   buyer custom entities keep the jsonb fallback.
3. **Extend `DataProvider` with capability flags** — optional `upsert`, `idempotentInsert`,
   `fullTextSearch`, `bulkInsert`, `vectorSearch` methods; adapters declare support via
   `capabilities`.
4. **Hybrid apply flow** — goal skills call `vybekiit apply-preset <feature>`; doctor
   verifies expected presets via `verify-presets` and suggests `--fix`.
5. **NoSQL v1.1** — Mongo/Firebase/AWS manifests render collection/index notes; full
   apply ships later.

## Consequences

- Plug-and-play SaaS tables align with `@vybekiit/*` packages without forking better-auth
  schema (`auth-bridge` adds `user_profiles` only).
- Neon/Railway gain relational preset support without breaking custom `save-data` entities.
- Maintenance surface grows: each new feature adds a manifest + renderer output per
  Postgres provider.
- Supersedes implicit "schemas are always agent-generated" stance for **kit features**;
  buyer-defined entities remain agent-driven.

## Alternatives rejected

- **Full starter schema upfront** — bloats every project with unused tables.
- **Schema-only presets without DataProvider extensions** — orders already needed upsert;
  raw Supabase client escape hatches do not scale.
- **Keep jsonb for all Neon/Railway data** — cannot deliver PK/FK or index guarantees.
