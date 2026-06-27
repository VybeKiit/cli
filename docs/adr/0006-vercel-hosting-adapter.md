# ADR-0006 — Vercel hosting adapter

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-me` skills gap session

## Context

The web template is Next.js. Cloudflare Pages remains the default host (ADR-0002), but some
builders and agents expect Vercel's managed Next.js deploy path. Official Vercel-labs agent skills
cover App Router patterns; closing the agent-builder gap also requires a real deploy adapter and
CLI in `vybekiit doctor`.

A grill session locked: **add Vercel as opt-in**, keep Cloudflare as default, pin vercel-labs
Next.js skills in the web template, and wire a thin `deploy-vercel-vybekiit.md` platform wrapper.

## Decision

1. **Extend `@vybekiit/deploy`** with a `vercel` adapter behind the existing `Hosting` interface.
2. **Extend `HOSTING_PROVIDER`** enum: `cloudflare`⭐ | `vercel` | `aws`.
3. **Config:** `VERCEL_TOKEN` required; `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` optional until
   go-live links the project.
4. **`vybekiit doctor`** installs and probes the `vercel` CLI when `HOSTING_PROVIDER=vercel`
   (same npm-global pattern as `wrangler`).
5. **Skills:** buyer `go-live` skill unchanged in voice; agent follows
   `.vybekiit/platform-skills/deploy-vercel-vybekiit.md` when Vercel is selected.
6. **Official upstream:** Vercel docs + vercel-labs pinned skills for Next.js; deploy facts from
   vercel.com/docs and the CLI.

## Consequences

- Default toolchain unchanged: `[gh, wrangler, supabase]` for default web buyers.
- Vercel buyers get `[gh, vercel, supabase]` — never both hosting CLIs unless they switch providers.
- One more adapter to maintain when Vercel CLI flags change — accepted cost of breadth.
- ADR-0002 hosting list updated conceptually: Cloudflare⭐, Vercel, AWS.
