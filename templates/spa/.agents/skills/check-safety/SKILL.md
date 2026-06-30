---
name: check-safety
description: confirm the app is protected end-to-end before ship — abuse, database safety, and every. Use when the builder says something like: am i ready to ship; is my app safe; did we cover security.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: check-safety

**Goal:** confirm the app is protected end-to-end before ship — abuse, database safety, and every
API route classified correctly. Output a plain pass/fail summary for the builder.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate when green.

## Steps

1. **Abuse / DDoS layer.** Confirm `SECURITY_RATE_LIMIT` and `SECURITY_ORIGIN_LOCK` are `on` in
   `.env`. Confirm `middleware.ts` passes the request path for tiered limits. Confirm `/api/webhook`
   is **not** blocked by origin lock (payment providers POST cross-origin). Run quick probes: hammer
   `/api/auth/signin` → expect "slow down"; submit `/api/contact` at human pace → still works.
   **Verify:** login protected; contact form not throttled like login.

2. **SQL / database safety.** Grep for raw SQL, `$executeRaw`, or string-built queries — replace with
   `@vybekiit/db` `DataProvider`. If Supabase: confirm RLS on buyer tables. Every API route validates
   input with zod at the boundary.
   **Verify:** no raw SQL in app code; DataProvider-only data access.

3. **Endpoint taxonomy.** Audit every `/api/*` route:
   - Public forms (contact, waitlist) → lenient limit, no session
   - Auth routes → strict limit
   - Webhooks → signature verified, origin lock off
   - `/api/me` and user data → session required
   - Admin / bulk export → must not exist without auth
   **Verify:** each route matches the table; fix misclassified routes.

4. **Toolchain.** Run `vybekiit doctor` — agent CLIs, cloud CLIs, platform skills present.
   If Google sign-in was requested: `GOOGLE_OAUTH_*` populated, gcloud signed in.

5. **Edge (at go-live).** Confirm `infra/cloudflare/` edge worker uses the same `SECURITY_*` toggles.
   **Verify:** dual-layer protection documented in go-live.

6. **Code readiness (agent-only checks).** Run silently; summarize in plain English:
   - `node scripts/check-no-console.mjs` — no debug `console.log` in `app/` or `src/`
   - Scan `src/lib/` for duplicate exported function names; merge duplicates
   - Spot-check API routes use `@/lib/logger` instead of bare console
   - If going live with alerts: when `OBSERVABILITY_PROVIDER=sentry`, confirm `SENTRY_DSN` is set
   **Verify:** tell the builder *"Your app is quiet in production and uses one place for each kind of logic."*

7. **UI consistency (agent-only).** Grep checks:
   - Raw `<button` / `<input` outside `src/components/ui/` in `app/` and feature components → fix to kit primitives
   - Forbidden UI libs (`@mui/`, `@chakra-ui/`, `antd`, `nativewind`, `@heroui/`) → must be empty in `app/` and `src/` except mirrored namespaces
   - Namespaced mirrors (`src/components/bundui/`, `magicui/`, etc.) are upstream copies — normalize when composing screens in `app/`
   - Arbitrary Tailwind `h-[`, `w-[`, `gap-[`, `mt-[` in `app/` → review and normalize
   **Verify:** tell the builder *"Your app's buttons, spacing, and colors all match — it looks like one professional product."*

8. **Quality smoke (soft).** Run `pnpm quality` — format, lint, typecheck, and tests. Report pass/fail
   in plain English. On warn-only Biome issues: fix obvious ones; do not block ship on style warnings
   unless egregious.
   **Verify:** tell the builder *"Your app is tested and tidy."*

## Definition of done

Plain-language summary: login protected, contact works, webhooks verified, database safe, code quiet in
production, UI consistent, tests and lint green, doctor green. 🎉 *Celebrate* when all layers pass.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
