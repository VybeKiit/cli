---
name: connect-account-backend
description: people can sign in from the phone app or extension. Use when the builder says something like: connect account backend.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: connect-account (mobile / extension)

**Goal:** people can sign in from the phone app or extension.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Run `vybekiit plan-readiness sign-in` first. If no backend exists, execute
> orchestration steps (scaffold `backend/`, wire auth, set `EXPO_PUBLIC_APP_URL` or
> `WXT_PUBLIC_APP_URL`) **without asking the builder to choose**.

## Steps

1. **Readiness.** Run `vybekiit plan-readiness sign-in <mobile|extension>` and execute every
   orchestration step until `ready: true`.
   **Verify:** backend `/health` or web sign-in responds.

2. **Wire client.** Replace `TODO(vybekiit): … — skill: connect-account` in `auth-client.ts`.
   Point API calls at the backend `APP_URL`.
   **Verify:** sign-in flow works from the client UI.

3. **Protect gated UI.** Login when signed out; main UI when signed in.
   **Verify:** both paths tested.

## Definition of done

Real sign-in works from the client against the live backend.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
