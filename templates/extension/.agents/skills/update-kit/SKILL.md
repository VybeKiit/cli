---
name: update-kit
description: get the latest kit improvements safely, without breaking the builder's extension. Use when the builder says something like: update the kit; get the latest; upgrade.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: update-kit

**Goal:** get the latest kit improvements safely, without breaking the builder's extension.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do the whole update; the builder just watches and confirms.

> (Under the hood — agent-only) Updates run through **three channels** inside this one skill:
> npm package bumps (`@vybekiit/*`), agent-layer refresh from the template mirror, and platform
> instruction files when `skills-lock.json` exists (none pinned yet for extension). The builder's
> own extension code is never touched. Use `planKitUpdate()` for channel 1; `vybekiit sync-agent-layer`
> for channel 2; `npx skills update -y` for channel 3 when a lock file appears.

## Steps

1. **Run the tests first — the safety net.** Run the project's tests and make sure they're green
   before changing anything.
   **Verify:** all tests pass. If any are red, fix those first.

2. **Explain in one line.** *"I'm going to pull in the latest improvements — the kit packages and
   my latest instructions. Your own work won't be touched, and I'll test everything after."*

3. **Update all three channels** (same plain sentence to the builder for each — never name tools):

   **3a — Kit packages.** Bump the `@vybekiit/*` packages to their latest versions (use
   `planKitUpdate()`).
   **Verify:** the install finishes cleanly.

   **3b — Agent instructions.** Run `vybekiit sync-agent-layer` (or pass `extension` if detection fails).
   Tell the builder: *"I'm refreshing my latest instructions for your project."*
   **Verify:** command exits 0. Buyer-owned `.vybekiit/extensions/**` and extension rows in
   `goal-index.md` are never overwritten.

   **3c — Platform instructions.** If `skills-lock.json` exists, run `npx skills update -y`.
   Skip with no message if the lock file is absent (extension has no pinned platform skills yet).
   **Verify:** update completes when a lock exists.

4. **Re-run the tests.** Run the full suite again.
   **Verify:** still green. Roll back kit packages if needed.

5. **Try the extension for real.** Load the preview in the browser and click through the main things.
   **Verify:** the add-on still works.
   🎉 *Celebrate* — they're on the latest, and nothing broke.

## If anything breaks

Run `doctor`. Roll kit packages back to the last working versions if you can't fix it quickly.

## Definition of done

Kit packages updated, agent instructions refreshed, platform skills updated when pinned, tests
green, extension preview works, and none of the builder's own extension files were changed.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
