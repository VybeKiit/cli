# Skill: add-realtime

**Goal:** the builder's app can push live updates to signed-in users.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Agent-only) Read `REALTIME_PROVIDER` and follow `platform-skills/db-presets-vybekiit.md` +
> `platform-skills/supabase-vybekiit.md` when on the default stack.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/RealtimePage.tsx` export `RealtimePage` into the buyer app at route `/dashboard/realtime`.
   Recipe id: `realtime`. Presets: realtime_publications.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('add-realtime')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Explain in one line.** *"I'll turn on live updates so your app refreshes when data changes."*

2. **Apply the realtime preset.**
   - Run `vybekiit apply-preset realtime_publications` (dry-run first if DATABASE_URL is new).
   - **Verify:** `vybekiit verify-presets realtime_publications` passes.

3. **Wire `@vybekiit/realtime`.** Use `resolveRealtimeProvider()` in server routes or client hooks
   as your template README describes.

4. **Smoke test.** Open two browser tabs on a signed-in page; change data in one tab.
   **Verify:** the other tab updates without a full refresh.

## Definition of done

Live channel works for at least one table the builder cares about, with preset verified.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.
