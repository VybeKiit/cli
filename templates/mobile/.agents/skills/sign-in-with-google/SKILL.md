---
name: sign-in-with-google
description: people tap **Continue with Google** on their phone — one button for sign-in **or** sign-up. Use when the builder says something like: sign in with google; continue with google.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: sign-in-with-google

**Goal:** people tap **Continue with Google** on their phone — one button for sign-in **or** sign-up.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Use **Expo Google OAuth** (`expo-auth-session` + Google provider). Never embed secrets
> in the app — only the public client id. Send the ID token to the web backend verifier.

## Steps

1. **Backend first.** The web app must have Google sign-in wired (`sign-in-with-google` on web).
   **Verify:** web Google login works; `EXPO_PUBLIC_APP_URL` points at that backend.

2. **Run doctor.** `vybekiit doctor` on this project — installs agent + cloud tools.
   **Verify:** doctor passes.

3. **Google clients for iOS + Android.** Use `gcloud` to create mobile OAuth clients. Set
   `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` and any platform ids Expo needs in `app.json`.
   **Verify:** client id present; secret stays on backend only.

4. **Wire Expo Google sign-in.** Use `expo-auth-session` with the Google provider — native flow,
   not an in-app browser redirect to a generic web page.
   **Verify:** Google button works on device/simulator.

5. **Exchange token for session.** POST the ID token to the backend verifier; store the session in
   `expo-secure-store` (same as `connect-account`).
   **Verify:** new and returning users reach the dashboard.

## Definition of done

Continue with Google works on device; backend verifier accepts the token; no secrets in the app bundle.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
