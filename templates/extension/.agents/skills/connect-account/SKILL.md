---
name: connect-account
description: people can sign in through the extension. Use when the builder says something like: sign in; log in; create accounts; add users; forgot password; reset password.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: connect-account

**Goal:** people can sign in through the extension.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Prefer `connect-account-backend.md` for orchestration. Run
> `vybekiit plan-readiness sign-in extension` — scaffold backend automatically if needed.

## Steps

1. **Readiness.** Run `vybekiit plan-readiness sign-in extension` and follow orchestration steps.
   **Verify:** backend or web sign-in works.

2. **Wire extension client.** Replace `TODO(vybekiit): … — skill: connect-account` in auth client.
   **Verify:** sign-in flow works from the extension UI.

3. **Protect gated UI.** Show login when signed out; main UI when signed in.
   **Verify:** both paths manually tested.

## Definition of done

Real account sign-in works from the extension against the live backend.

## If anything breaks

Run `doctor`. If backend auth or MCP fails once, run `vybekiit doc-fallback better-auth` and use the
plain stuck phrase — never say MCP to the builder.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
