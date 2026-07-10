# Skill: add-images

**Goal:** add logos, hero images, icons, and other pictures that ship with the app (not user uploads).

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You place and wire images; the kit compresses them automatically.

> (Under the hood — agent-only) Project assets live in `public/` (web), `assets/` (mobile), or
> `public/icon/` (extension). Run `node scripts/optimizeAssets.mjs` (or `pnpm build` / `pnpm start`
> which run it automatically). Display with `VybeImage` from `@vybekiit/assets` — it picks optimized
> formats and CDN URLs for remote images via `resolveAssetDelivery()`.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/BrandAssetsPage.tsx` export `BrandAssetsPage` into the buyer app at route `/dashboard/brand`.
   Recipe id: `brand-assets`. Presets: none.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('add-images')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Pick the folder.** Web → `public/`. Mobile → `assets/`. Extension → `public/icon/` (icons) or
   `public/` for other static files.
   **Verify:** the folder exists (scaffold ships placeholders).

2. **Add the image files.** Copy or generate the builder's logo/hero/icons into that folder.
   **Verify:** files are on disk with sensible names (`logo.svg`, `hero.jpg`, etc.).

3. **Optimize.** Run `node scripts/optimizeAssets.mjs` (or the project's build/start script).
   **Verify:** optimized variants exist (WebP/AVIF for photos, compressed SVG) and
   `asset-manifest.json` is updated when applicable.

4. **Show them in the UI.** Use `VybeImage` (`src/components/vybe-image.tsx`) instead of raw `<img>`
   or bare `next/image` / `Image` — pass `/logo.svg` or a remote upload URL.
   **Verify:** the screen builds and images render.

5. **Try it for real.** Open the page (or extension popup / mobile screen) and confirm images load fast.
   **Verify:** images look sharp and load quickly.
   🎉 *Celebrate* — their brand is on the app.

## If anything breaks

Run `doctor` and re-run optimize. Most issues are a missing file path or skipping the optimize step.

## Definition of done

Project images appear in the app, optimized assets were generated, and `VybeImage` is used.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
