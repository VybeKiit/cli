---
name: update-kit
description: get the latest kit improvements safely, without breaking the builder's app. Use when the builder says something like: update the kit; get the latest; upgrade.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: update-kit

**Goal:** get the latest kit improvements safely, without breaking the builder's app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do the whole update; the builder just watches and confirms.

> (Under the hood — agent-only) Updates run through **three channels** inside this one skill:
> npm package bumps (`@vybekiit/*`), agent-layer refresh from the template mirror, and platform
> instruction files pinned in `.agents/skills/`. The builder's own app code is never touched — only
> maintained kit files listed in ADR-0007. Use `planKitUpdate()` from `@vybekiit/agent-kit` for
> channel 1; `vybekiit sync-agent-layer` for channel 2; `npx skills update -y` for channel 3 when
> `skills-lock.json` exists.

## Steps

1. **Run the tests first — the safety net.** Run the project's tests and make sure they're green
   before changing anything. This is the before-picture you'll compare against.
   **Verify:** all tests pass. If any are red, fix those first — never update on top of a broken app.

2. **Explain in one line.** *"I'm going to pull in the latest improvements — the kit packages and
   my latest instructions. Your own work won't be touched, and I'll test everything after."*

3. **Update all three channels** (same plain sentence to the builder for each — never name tools):

   **3a — Kit packages.** Bump the `@vybekiit/*` packages to their latest versions (use
   `planKitUpdate()` to decide what to bump).
   **Verify:** the install finishes cleanly.

   **3b — Agent instructions.** Run `vybekiit sync-agent-layer` (or pass `web` if detection fails).
   Regenerates vocabulary/contract sections from agent-kit. Optionally run `vybekiit render-agent-layer`
   after local edits to maintained renderers.
   Tell the builder: *"I'm refreshing my latest instructions for your project."*
   **Verify:** command exits 0; allowlisted paths copied (`.vybekiit/`, `AGENTS.md`, `language.md`,
   etc.). Buyer-owned `.vybekiit/extensions/**` and extension rows in `goal-index.md` are never
   overwritten.

   **3c — Platform instructions.** If `skills-lock.json` exists, run `npx skills update -y`.
   Use the same plain sentence — never name Expo, Vercel, or the skills CLI.
   **Verify:** update completes or report a plain-language retry later.

4. **Re-run the tests.** Run the full suite again.
   **Verify:** still green. If something broke, fix it — or roll back to the previous versions and
   tell the builder, in plain words, what happened. Never leave them on a broken version.

5. **Try the app for real.** Start it and click through the main things (sign-in, a purchase, saving
   data — whatever they use).
   **Verify:** the app still works.
   🎉 *Celebrate* — they're on the latest, and nothing broke.

## If anything breaks

Run `doctor`. If a new version doesn't get along with their app and you can't fix it quickly, roll
the kit packages back to the last working versions — the app keeps working while you sort it out.

## Definition of done

The kit packages are on their latest working versions, agent instructions are refreshed, platform
skills are updated when pinned, the tests are green, the app still works, and none of the builder's
own app files were changed.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
