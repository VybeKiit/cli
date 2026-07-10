# Skill: sign-in-with-phone

**Goal:** people can sign in with a text message code.

**Contract:** one action at a time · verify-before-advance · plain language · translate errors · celebrate.

> (Agent-only) Routes: `POST /api/auth/send-sms-code`, `POST /api/auth/verify-sms-code`. Twilio via
> `@vybekiit/auth` + `@vybekiit/notifications`.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install / extend the auth page recipe first (catalog SSOT — Option C).**
   Copy or extend `apps/componentLibrary/src/pageRecipes/AuthPage.tsx` export `AuthPage` at route `/login`
   with phone + code UI. Recipe id: `auth`. Preset: auth-bridge.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('sign-in-with-phone')` / page-recipe-manifest.json.
   **Verify:** `/login` shows practice phone sign-in UI before provider wiring.

1. **Run `setup-sms` first** if Twilio secret settings are not filled in.
   **Verify:** `NOTIFICATIONS_PROVIDER=twilio` and Twilio keys in `.env`.

2. **Add phone + code UI** on login → send code, then verify.
   **Verify:** practice mode accepts code `000000` with empty Twilio settings.

3. **Try a real number** when Twilio is configured.
   **Verify:** SMS arrives and code signs the user in.

4. **Append checklist entry** (phone sign-in enabled).

## If anything breaks

Run `vybekiit doc-fallback twilio` once; tell the builder you're checking the official setup guide
(plain phrase only).

## Definition of done

Send code → verify → dashboard; checklist updated.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
