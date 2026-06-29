# Skill: add-teams

**Goal:** the builder can invite teammates and work in shared organizations.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You design and wire the org model; the builder describes who should
have access.

> (Under the hood — agent-only) Orgs via `@vybekiit/tenancy` → `resolveTenancyProvider()` first;
> then extend UI. Follow `platform-skills/better-auth-vybekiit.md` when auth wiring is needed.

## Steps

1. **Confirm sign-in works first.** If `add-signin` is not done, run that skill first — teams need
   accounts.
   **Verify:** a user can sign in.

2. **Agree on the team shape, in plain words.** Ask who can invite whom (e.g. "the owner invites
   people by email"). You decide the data model; they confirm the behavior.
   **Verify:** read the behavior back in one sentence and get a yes.

3. **Wire organizations and invites.** Add org + membership tables via `resolveDataProvider()`; wire
   invite flow through auth. Replace dashboard team placeholder
   (`TODO(vybekiit): … — skill: add-teams`).
   **Verify:** code builds; migration applies cleanly.

4. **Build the invite UI.** A simple page or modal where the owner enters an email and sends an
   invite. Plain copy only — no jargon.
   **Verify:** invite record created in the database.

5. **Test end-to-end.** Write a test that creates an org, adds a member, and reads membership.
   **Verify:** test green. 🎉 *Celebrate* — they can invite teammates.

## If anything breaks

Run `doctor`. Common cause: sign-in not wired, or migration not applied.

## Definition of done

Owner can invite a teammate by email, the invite is stored, and a passing test covers org membership.
