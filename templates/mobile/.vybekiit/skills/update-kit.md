# Skill: update-kit

**Goal:** get the latest kit improvements safely, without breaking the builder's app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do the whole update; the builder just watches and confirms.

> (Under the hood — agent-only) Updates run through **three channels** inside this one skill:
> npm package bumps (`@vybekiit/*`), agent-layer refresh from the template mirror, and platform
> instruction files pinned in `.agents/skills/` (Expo skills). The builder's own app code is never
> touched. Use `planKitUpdate()` for channel 1; `vybekiit sync-agent-layer` for channel 2;
> `npx skills update -y` for channel 3 when `skills-lock.json` exists.

## Steps

1. **Run the tests first — the safety net.** Run the project's tests and make sure they're green
   before changing anything.
   **Verify:** all tests pass. If any are red, fix those first — never update on top of a broken app.

2. **Explain in one line.** *"I'm going to pull in the latest improvements — the kit packages and
   my latest instructions. Your own work won't be touched, and I'll test everything after."*

3. **Update all three channels** (same plain sentence to the builder for each — never name tools):

   **3a — Kit packages.** Bump the `@vybekiit/*` packages to their latest versions (use
   `planKitUpdate()`).
   **Verify:** the install finishes cleanly.

   **3b — Agent instructions.** Run `vybekiit sync-agent-layer` (or pass `mobile` if detection fails).
   Tell the builder: *"I'm refreshing my latest instructions for your project."*
   **Verify:** command exits 0.

   **3c — Platform instructions.** If `skills-lock.json` exists, run `npx skills update -y`.
   Never name Expo or the skills CLI to the builder.
   **Verify:** update completes or report a plain-language retry later.

4. **Re-run the tests.** Run the full suite again.
   **Verify:** still green. Roll back kit packages if needed.

5. **Try the app for real on the phone.** Start it and tap through the main things (sign-in, a
   purchase, saving data — whatever they use).
   **Verify:** the app still works on the device.
   🎉 *Celebrate* — they're on the latest, and nothing broke.

## If anything breaks

Run `doctor`. Roll kit packages back to the last working versions if you can't fix it quickly.

## Definition of done

Kit packages updated, agent instructions refreshed, platform skills updated when pinned, tests
green, app works on device, and none of the builder's own app files were changed.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

