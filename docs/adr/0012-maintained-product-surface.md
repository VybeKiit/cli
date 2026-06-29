# ADR-0012: Maintained product surface expansion

**Status:** Accepted  
**Date:** 2026-06-29

## Context

VybeKiit shipped core infrastructure adapters (auth, db, payments, deploy, assets) but vibe coders
still needed background jobs, visitor stats, push notifications, AI runtime, search, live updates,
content pages, compliance, SEO, team workspaces, fast KV, and shared i18n — each was skill-only or
missing.

## Decision

1. **Twelve new `@vybekiit/*` packages** behind the existing one-interface pattern, each with a
   `resolve*Provider()` entry point and local no-op or cloud default (ADR-0008).
2. **Defaults follow Cloudflare + Supabase** when env is provisioned (jobs/KV on CF; search/realtime
   on Supabase; analytics on Plausible; AI on OpenAI; tenancy on better-auth + db).
3. **Tenancy as maintained primitives** — `add-teams` uses `@vybekiit/tenancy` instead of bespoke
   migrations every time.
4. **AI as runtime adapter** — no demo apps; `add-ai` skill wires `complete()`/`stream()` on demand.
5. **Money pipeline gate** invites all template mirrors via `GITHUB_GATE_REPOS` CSV (ADR-0005).

## Consequences

- **21 npm packages** to publish and maintain; mitigated by shared tsup base and resolver tests.
- Buyer templates gain thin `src/lib/*-client.ts` wire points and goal-named skills only — no new
  tech-named buyer skills for each adapter.
- Wave B (live LS checkout, npm token, CF deploy) remains a manual checklist (`docs/wave-b-live-spine.md`).
