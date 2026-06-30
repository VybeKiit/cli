---
name: publish-app
description: the builder's app is **in the App Store and Google Play** for anyone to download. This is. Use when the builder says something like: put it online; publish; make it live; ship it; deploy; publish app.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: publish-app

**Goal:** the builder's app is **in the App Store and Google Play** for anyone to download. This is
the marquee mobile skill — the payoff a phone app exists for.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You run the build and submit; the builder does only the few
account steps the stores legally require, one at a time.

> (Under the hood — agent-only) Build + submit through the `launch` CLI (launch-store) using the
> template's `launch.config.ts`. Follow `platform-skills/launch-store-vybekiit.md` and pinned
> `.agents/skills/expo-deployment`.

## Steps

1. **Pre-flight (code readiness).** Run `check-safety` steps 3–4 (no debug console, kit logger, UI
   consistency, no forbidden libs) and **quality smoke** (`pnpm quality`) before packaging. Fix
   anything red before continuing.
   **Verify:** code checks and quality smoke green.

2. **Confirm the app's identity.** Resolve the `TODO(vybekiit)` markers in `app.json`: a real app
   **name**, a permanent **unique id** for each store (reverse-domain, e.g. `com.theirbrand.app`),
   and a tap-to-open address. Set the listing details in `launch.config.ts` (age rating, category,
   review contact). Decide sensible defaults; confirm the name with the builder.
   **Verify:** the app's identity is set and no `publish-app` markers remain (re-grep `TODO(vybekiit)`).

3. **The one-time store accounts (they cost money — say so plainly).** Tell them, in plain words,
   that each store needs a paid developer account (Apple's is a yearly fee; Google's is a one-time
   fee) and walk them through creating each — **one step at a time**, where to tap. Then guide the
   one sign-in the build tool needs (a browser opens; they approve).
   **Verify:** both accounts exist and the tools report they're signed in (run `vybekiit doctor`).

4. **Build the installable version.** Run the build yourself. Explain in one line: *"I'm packaging
   your app for the stores now — this runs in the cloud and can take a little while."*
   **Verify:** the build finishes green and an installable file is produced. If it fails, run `doctor`
   and read the one real cause — never paste the red log.

5. **Submit to the stores.** Send the build in for review.
   **Verify:** each store confirms the submission was received. 🎉 *Celebrate this milestone* — it's
   submitted.

6. **Set expectations on review.** Tell them plainly: the stores read every app before it goes
   public, which can take anywhere from a few hours to a few days — nothing is broken while they
   wait. Check the review state with `launch status` and report it in plain words; don't claim it's
   live until the store says so.
   **Verify:** before telling them it's public, confirm the store shows "ready for sale" / "live".
   🎉 *Celebrate* — their app is in the stores; give them the links to share.

## If anything breaks

Run `doctor`. The common blockers are: not signed in to a store account, the app's unique id not set,
or a missing review detail — fix the one cause for them, don't explain the internals.

## Definition of done

The app is submitted (and, once approved, live) on both stores, its identity markers are resolved,
and the builder has the store links.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
