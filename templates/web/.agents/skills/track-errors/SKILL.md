---
name: track-errors
description: the builder gets alerted when something breaks in their live app — without watching logs themselves. Use when the builder says something like: tell me when things break; error alerts; app crashes.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: track-errors

**Goal:** the builder gets alerted when something breaks in their live app — without watching logs themselves.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You set up alerts; the builder only pastes one key when asked.

> (Under the hood — agent-only) Wire `@vybekiit/observability` via `resolveObservabilityProvider()`.
> Default is silent no-op (`OBSERVABILITY_PROVIDER=local`). This skill switches to Sentry and proves
> an alert fires. Follow `sentry-vybekiit.md`. Never say "Sentry" unless they ask — say "error alerts."

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/SystemHealthPage.tsx` export `SystemHealthPage` into the buyer app at route `/admin/health`.
   Recipe id: `system-health`. Presets: none.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('track-errors')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Explain in one line.** *"I'm going to set up alerts so you know when something breaks in your live app."*

2. **Create or open the alert project.** Sign in to the error-tracking dashboard (Sentry free tier) and
   create a project for this app. Copy the **DSN** (connection string) from project settings.
   **Verify:** you have a DSN ready — do not paste it in chat.

3. **Wire it in.** Set in `.env`:
   - `OBSERVABILITY_PROVIDER="sentry"`
   - `SENTRY_DSN="<paste from dashboard>"`
   Confirm `instrumentation.ts` and `src/lib/observability.ts` exist and import `@vybekiit/observability`.
   **Verify:** app builds; provider resolves without error.

4. **Prove it works.** Trigger a deliberate test error (dev-only button or one-time API call). Confirm
   the event appears in the dashboard within a minute.
   **Verify:** show the builder the alert entry in plain words ("Your test error showed up — alerts work.").

5. **Protect live users.** Ensure production errors call `observability.captureException` from error
   boundaries or API catch blocks — not bare `console.error` only.
   **Verify:** one real code path uses `observability.captureException`.

6. **Celebrate.** 🎉 *"You're covered — if something breaks online, you'll know."*

## If anything breaks

Run `doctor`. Most failures are a missing or wrong DSN — re-copy from the dashboard into `.env` only
(never chat). If MCP fails once, run `vybekiit doc-fallback sentry`.

## Definition of done

`OBSERVABILITY_PROVIDER=sentry`, DSN set, test alert received, and the builder knows they'll be notified when things break.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
