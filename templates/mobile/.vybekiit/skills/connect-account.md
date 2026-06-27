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

1. **Make sure the backend can sign people in first.** Sign-in happens on the builder's web app. If
   the web side doesn't have sign-in set up yet, run the **web** add-signin skill (or `go-live`) over
   there first, then come back — the phone app can only connect to a backend that already does it.
   **Verify:** the backend's sign-in works (the web app accepts a real account), and `APP_URL` in
   `.env` points at that deployed backend.

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

Run `doctor`. The usual causes are the backend address (`APP_URL`) not pointing at the deployed web
app, or the backend not having sign-in set up yet — fix the one cause for them, don't explain the
internals.

## Definition of done

A real account can sign up, sign in, and reach the protected dashboard on the phone; a passing test
covers it; no `connect-account` markers remain (re-grep `TODO(vybekiit)`).
