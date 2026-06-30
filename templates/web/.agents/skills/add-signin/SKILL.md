---
name: add-signin
description: people can create accounts and log in to the builder's app. Use when the builder says something like: sign in; log in; create accounts; add users.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-signin

**Goal:** people can create accounts and log in to the builder's app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only pastes a value or clicks
"approve" when a step truly needs it.

> (Under the hood — agent-only) Sign-in routes through `@vybekiit/auth`'s `resolveAuthProvider()`.
> Follow `platform-skills/better-auth-vybekiit.md` and `supabase-vybekiit.md` when wiring.

## Steps

1. **Make sure their app can remember things first.** Sign-in needs a database. If one isn't set
   up yet, run `save-data` first, then come back.
   **Verify:** the database is reachable (`@vybekiit/db`'s `pingDatabase`).

2. **Set the sign-in secret settings.** Generate `BETTER_AUTH_SECRET` and collect `DATABASE_URL`
   through the `doctor` flow — never ask the builder to type these by hand. Save them to the secret
   settings file.
   **Verify:** both values are present and non-empty.

3. **Add the sign-in handler.** Create the auth server route at `app/api/auth/[...all]/route.ts`
   that mounts `resolveAuthProvider()`.
   **Verify:** the route builds and responds.

4. **Connect the sign-in screens.** In `src/lib/auth-client.ts`, replace the stubbed
   `signInWithPassword` / `signUpWithPassword` / `sendEmailCode` / `verifyEmailCode` with real
   `resolveAuthProvider()` calls (these resolve the `TODO(vybekiit): … — skill: add-signin` markers;
   grep them).
   **Verify:** the sign-up and login screens accept a real account.

5. **Protect the dashboard.** Redirect to `/login` when no one is signed in (use the provider's
   `getUser`). This resolves the dashboard's add-signin marker.
   **Verify:** signed out → sent to login; signed in → see the dashboard.

6. **Write a passing test** covering sign-up → login, and keep it green.

7. **Try it for real.** Create an account, log in, and land on the dashboard.
   **Verify:** the full sign-up → login → dashboard flow works.
   🎉 *Celebrate* — people can now have their own accounts.

## If anything breaks

Run `doctor`. Most issues are a missing secret setting or the database not reachable yet — fix it
for them, don't explain the internals.

## Definition of done

A real account can sign up, log in, and reach the protected dashboard; a passing test covers it; no
add-signin markers remain (re-grep `TODO(vybekiit)`).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
