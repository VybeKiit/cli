# Skill: add-search

**Goal:** users can search the builder's data in plain language.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

> (Under the hood — agent-only) `@vybekiit/search` → `resolveSearchProvider()` via `src/lib/search-client.ts`.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/SearchPage.tsx` export `SearchPage` into the buyer app at route `/dashboard/search`.
   Recipe id: `search`. Presets: search_documents + embeddings.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('add-search')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. Explain: *"I'll add search so people can find things quickly."*
2. Run `vybekiit apply-preset search_documents` then wire index on create/update and a search UI calling
   `getSearch().search(query)` (see `platform-skills/db-presets-vybekiit.md`).
3. **Verify:** `vybekiit verify-presets search_documents` + search test green.

## Definition of done

User can search and see matching results.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
