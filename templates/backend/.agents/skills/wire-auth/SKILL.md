---
name: wire-auth
description: people can sign in through this API (mobile/extension clients call these routes). Use when the builder says something like: sign in; log in; create accounts; add users; wire auth.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: wire-auth

**Goal:** people can sign in through this API (mobile/extension clients call these routes).


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run `vybekiit plan-readiness sign-in backend` and follow any orchestration steps.
2. Wire `@vybekiit/auth` via `resolveAuthProvider()` — routes live in `src/routes/auth.routes.ts`.
3. **Verify:** POST `/api/auth/signin` returns a user and sets a session cookie.
4. Tell the builder to point their app at `APP_URL` (e.g. `http://localhost:4000`).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
