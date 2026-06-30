---
name: add-teams
description: people can join teams and invite others — inside the app. Use when the builder says something like: invite teammates; add my team; organizations.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-teams

**Goal:** people can join teams and invite others — inside the app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Teams live on the **backend** (web app). Run the **web**
> `add-teams` skill on the deployed backend first, then wire the phone app to list orgs and accept
> invites via `APP_URL`. Requires `connect-account` on the phone side.

## Steps

1. **Backend teams first.** If the web app doesn't have organizations yet, run **web** `add-teams`
   there (or point the builder to set it up on the web side).
   **Verify:** backend exposes org/membership endpoints.

2. **Connect the phone app.** Wire screens to call the backend for org list and invites; resolve
   `TODO(vybekiit): … — skill: add-teams` markers.
   **Verify:** signed-in user sees their team on the phone.

3. **Test and celebrate.** 🎉 They can invite teammates through the backend flow from the app.

## Definition of done

Phone app shows team membership backed by the web app's org model.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
