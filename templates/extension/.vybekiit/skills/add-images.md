# Skill: add-images

**Goal:** add extension icons and static images that ship with the extension package.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Icons live in `public/icon/`. `prebuild` runs
> `scripts/optimize-assets.mjs` to emit 16/48/128 PNGs referenced in `wxt.config.ts`. Extensions
> serve bundled assets from `chrome-extension://` — no runtime CDN; optimization is build-time only.

## Steps

1. **Add source art to `public/icon/`** (scaffold ships `icon.svg`).
   **Verify:** source file exists.

2. **Optimize.** Run `node scripts/optimize-assets.mjs` or `pnpm build`.
   **Verify:** `public/icon/16.png`, `48.png`, and `128.png` exist.

3. **Reload unpacked extension** in the browser and confirm the toolbar icon.
   **Verify:** icon appears in the extensions bar.
   🎉 *Celebrate* — their extension looks professional.

## Definition of done

Icon PNGs generated and visible in the browser toolbar.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

