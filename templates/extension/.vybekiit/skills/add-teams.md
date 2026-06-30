# Skill: add-teams

**Goal:** users can work in shared teams through the add-on.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Teams live on the **backend** web app. Run **web** `add-teams` there
> first; the extension calls org endpoints over the configured backend URL. Requires `connect-account`.

## Steps

1. **Backend teams first.** Run **web** `add-teams` on the deployed backend.
   **Verify:** backend org/invite APIs work.

2. **Wire the extension.** Connect popup or panel UI to backend team endpoints; resolve
   `TODO(vybekiit): … — skill: add-teams` if present.
   **Verify:** signed-in user sees team context in the add-on.

## Definition of done

Add-on reflects team membership from the backend.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

