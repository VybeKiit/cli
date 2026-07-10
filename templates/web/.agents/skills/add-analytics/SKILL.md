---
name: add-analytics
description: the builder can see who uses their app — visitor stats in plain language. Use when the builder says something like: visitor stats; analytics; track usage.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-analytics

**Goal:** the builder can see who uses their app — visitor stats in plain language.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire analytics; the builder never sees provider dashboards
unless you screen-share a summary.

> (Under the hood — agent-only) Wire Plausible or PostHog via `resolveAnalyticsProvider()` from
> `@vybekiit/analytics` (see `src/lib/analytics-client.ts` and `VybeAnalytics`). Never name the
> provider to the builder — say "visitor stats". Replace dashboard analytics placeholder
> (`TODO(vybekiit): … — skill: add-analytics`).

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/AnalyticsPage.tsx` export `AnalyticsPage` into the buyer app at route `/dashboard/analytics`.
   Recipe id: `analytics`. Presets: none.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('add-analytics')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Explain in one line.** *"I'll set up visitor stats so you can see how many people use your app."*

2. **Pick a provider and collect one value.** Choose Plausible (simple) or PostHog (richer) based on
   needs — default Plausible for v1. Ask the builder to create an account if needed; collect the site
   id / project key **one at a time** into the secret settings file.
   **Verify:** key saved.

3. **Wire the snippet.** Add the tracking script to the app layout (web) or equivalent entry point.
   For mobile/extension, wire through the backend or a minimal client event if applicable.
   **Verify:** build succeeds; no console errors on load.

4. **Confirm data flows.** Open the app once yourself; check the provider dashboard shows at least one
   visit (or use their test/debug mode).
   **Verify:** at least one event recorded. 🎉 *Celebrate* — they can see visitor stats.

5. **Optional dashboard link.** Add a plain "View stats" link in the builder dashboard that opens the
   provider UI — only if they asked for easy access.

## If anything breaks

Run `doctor`. Common cause: wrong site id or ad blockers in dev — test in a normal browser window.
If MCP fails once, run `vybekiit doc-fallback posthog` or `vybekiit doc-fallback plausible`.

## Definition of done

Visitor stats record at least one page view, and the builder knows where to check numbers in plain words.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
