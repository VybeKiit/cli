# Skill: connect-account

**Goal:** people can sign in through the extension.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Auth runs on the **backend web app**; extension calls it via `auth-client.ts`.
> Ensure web `add-signin` is done first.

## Steps

1. **Backend sign-in ready.** Web app must accept accounts. If not, set up web sign-in first.
   **Verify:** web sign-in works at the deployed URL.

2. **Wire extension client.** Replace `TODO(vybekiit): … — skill: connect-account` in auth client.
   **Verify:** sign-in flow works from the extension UI.

3. **Protect gated UI.** Show login when signed out; main UI when signed in.
   **Verify:** both paths manually tested.

## Definition of done

Real account sign-in works from the extension against the live backend.
