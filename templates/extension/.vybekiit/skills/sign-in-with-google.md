# Skill: sign-in-with-google

**Goal:** people sign in **or** sign up with Google from the extension — one tap.

**Contract:** one action at a time · plain language · celebrate.

> (Agent-only) Use **`chrome.identity`** (`getAuthToken` or `launchWebAuthFlow`). Client id lives in
> manifest `oauth2` — never in `.env`. Follow `platform-skills/chrome-extension-vybekiit.md`.

## Steps

1. **Backend ready.** Web app has Google sign-in + token verifier endpoint.
   **Verify:** web Google login works.

2. **Chrome Extension OAuth client.** Create via `gcloud`; add `oauth2.client_id` + scopes to the WXT
   manifest. Add `identity` permission (least privilege).
   **Verify:** manifest validates; extension loads unpacked.

3. **Wire `chrome.identity`.** Prefer `getAuthToken` for Google accounts; use `launchWebAuthFlow` only
   when needed.
   **Verify:** sign-in flow completes from extension UI.

4. **Session on backend.** Send token to verifier; store session in extension storage.
   **Verify:** signed-in state persists across popup reopen.

## Definition of done

Continue with Google works from the extension; no secrets in the bundle; backend verifier accepts token.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

