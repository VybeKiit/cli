---
name: add-notifications
description: users get notified when something important happens. Use when the builder says something like: notify users; send alerts.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-notifications

**Goal:** users get notified when something important happens.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Notifications are sent from the **backend** via `@vybekiit/email`.
> Run **web** `setup-email` and `add-notifications` on the backend first; the phone app only
> triggers or displays in-app messages if needed.

## Steps

1. **Backend notifications first.** Run **web** `add-notifications` on the deployed backend.
   **Verify:** backend sends email on the agreed trigger.

2. **Optional in-app hints.** If the builder wants a banner on the phone when something happens,
   wire a lightweight poll or push stub later — email is v1.
   **Verify:** user receives the email when the flow runs.

3. **Celebrate.** 🎉 Users hear from the app when it matters.

## Definition of done

Backend notification fires for at least one user action the builder cares about.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
