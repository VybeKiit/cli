# Skill: update-kit

**Goal:** get the latest kit improvements safely, without breaking the builder's app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do the whole update; the builder just watches and confirms.

> (Under the hood — agent-only) The kit's logic lives in the `@vybekiit/*` npm packages. Updates are
> **version bumps, not git merges** — the builder's own files are never touched (see CONTEXT
> Owned/Maintained). The passing test suite is what makes a bump safe.

## Steps

1. **Run the tests first — the safety net.** Run the project's tests and make sure they're green
   before changing anything. This is the before-picture you'll compare against.
   **Verify:** all tests pass. If any are red, fix those first — never update on top of a broken app.

2. **Explain in one line.** *"I'm going to pull in the latest improvements. Your own work won't be
   touched, and I'll test everything after."*

3. **Update the kit packages.** Bump the `@vybekiit/*` packages to their latest versions.
   **Verify:** the install finishes cleanly.

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

The kit packages are on their latest working versions, the tests are green, the app still works, and
none of the builder's own files were changed.
