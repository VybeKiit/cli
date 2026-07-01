---
name: add-images
description: add logos, splash screens, icons, and other pictures that ship with the app. Use when the builder says something like: add my logo; hero image; app icon; add images.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-images

**Goal:** add logos, splash screens, icons, and other pictures that ship with the app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Assets live in `assets/`. Run `node scripts/optimizeAssets.mjs`
> (hooked to `pnpm start`). `app.json` points `icon` and `splash` at generated PNGs. Use `VybeImage`
> for remote images (CDN URLs via `resolveAssetDelivery()`).

## Steps

1. **Add files to `assets/`.** Place `icon.svg` or PNGs; scaffold ships `assets/icon.svg`.
   **Verify:** files exist.

2. **Optimize.** Run `node scripts/optimizeAssets.mjs` — creates `icon.png` and `splash.png`.
   **Verify:** PNGs exist and `app.json` icon/splash paths resolve.

3. **Wire `VybeImage`** for any remote images (e.g. from your web backend).
   **Verify:** screen builds and images render.

4. **Preview on device/simulator.**
   **Verify:** icon and in-app images look correct.
   🎉 *Celebrate* — their app looks polished.

## Definition of done

Bundled images optimized, Expo icon/splash set, and `VybeImage` used for remote URLs.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
