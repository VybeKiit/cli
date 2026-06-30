---
name: connect-account
description: people can create accounts and sign in **inside the app**.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: connect-account

**Goal:** people can create accounts and sign in **inside the app**.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only approves or pastes a value
when a step truly needs it.

> (Under the hood — agent-only) A phone can't hold server secrets, so sign-in runs on the **backend**
> (the web app), not the device. The app calls the backend's auth endpoints over `APP_URL` via
> `src/lib/auth-client.ts` (using `postJson` from `fetch-json.ts`); the server side resolves the
> provider (`resolveAuthProvider()` — better-auth by default, Cognito on AWS). The device stores only
> the returned session pass, in the OS secure store (expo-secure-store). Never name any of this to the
> builder.

## Steps

1. **Make sure the backend can sign people in.** Run `vybekiit plan-readiness sign-in mobile` and
   execute every orchestration step (scaffold `backend/` if needed, wire auth, set
   `EXPO_PUBLIC_APP_URL`) without asking the builder to choose.
   **Verify:** backend `/health` or web sign-in works and `EXPO_PUBLIC_APP_URL` points at it.

2. **Connect the sign-in screens.** In `src/lib/auth-client.ts`, replace the stubbed
   `signInWithPassword` / `signUpWithPassword` / `sendEmailCode` / `verifyEmailCode` with real calls
   to the backend's auth endpoints (these resolve the `TODO(vybekiit): … — skill: connect-account`
   markers; grep them). Save the returned session pass to the device's secure store, and send it on
   later requests.
   **Verify:** the sign-up and login screens accept a real account against the backend.

3. **Protect the dashboard.** Send the user to the login screen when no one is signed in; show the
   dashboard when they are. This resolves the dashboard's sign-in marker.
   **Verify:** signed out → sent to login; signed in → see the dashboard.

4. **Write a passing test** covering sign-up → login, and keep it green.

5. **Try it for real on the phone.** Create an account, sign in, and land on the dashboard.
   **Verify:** the full sign-up → sign-in → dashboard flow works on the device.
   🎉 *Celebrate* — people can now have their own accounts in the app.

## If anything breaks

Run `doctor`. If backend auth or MCP fails once, run `vybekiit doc-fallback better-auth` and use the
plain stuck phrase — never say MCP to the builder. Usual causes are also the backend address
(`APP_URL`) not pointing at the deployed web app, or sign-in not set up yet on the backend.

## Definition of done

A real account can sign up, sign in, and reach the protected dashboard on the phone; a passing test
covers it; no `connect-account` markers remain (re-grep `TODO(vybekiit)`).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
