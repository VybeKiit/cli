---
name: connect-account-backend
description: people can sign in from the extension. Use when the builder says something like: connect account backend.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: connect-account (mobile / extension)

**Goal:** people can sign in from the extension.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Run `vybekiit plan-readiness sign-in extension` first. If no backend exists,
> execute orchestration steps automatically — scaffold `backend/`, wire auth, set
> `WXT_PUBLIC_APP_URL`.

## Steps

1. **Readiness.** Run `vybekiit plan-readiness sign-in extension` and execute orchestration steps.
   **Verify:** backend `/health` responds.

2. **Wire extension client.** Update `auth-client.ts` TODO markers.
   **Verify:** sign-in from popup works.

3. **Protect gated UI.** Login vs main UI paths.
   **Verify:** manual test both paths.

## Definition of done

Sign-in works from the extension against the live backend.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
