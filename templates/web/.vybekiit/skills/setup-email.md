# Skill: setup-email

**Goal:** the app can send emails — welcome notes, receipts, and sign-in codes.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the sending; the builder only confirms one detail
when asked.

> (Under the hood — agent-only) Send through `@vybekiit/email`'s `resolveEmailProvider()`. Read
> `EMAIL_PROVIDER` and follow the matching platform wrapper:
> - default / `cloudflare` → `platform-skills/cloudflare-email-vybekiit.md`
> - `resend` → `platform-skills/resend-vybekiit.md`
> - `ses` → `platform-skills/ses-vybekiit.md`
> Same skill, whichever is set — never name the service to the builder.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/EmailNotificationsPage.tsx` export `EmailNotificationsPage` into the buyer app at route `/dashboard/email`.
   Recipe id: `email-notifications`. Presets: notifications_log.
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Also reference `packages/agentKit` `getPageRecipeInstall('setup-email')` / page-recipe-manifest.json.
   **Verify:** route builds and shows practice UI before provider wiring.


1. **Confirm the one sending detail.** Ask for (or guide them to set up) a verified sender address —
   the "from" address their app's emails come from. Tell them exactly where to confirm it, then save
   it to the secret settings file.
   **Verify:** the sender address is set and confirmed.

2. **Wire sending.** Connect the app's email sending to `resolveEmailProvider()` (see wrapper for
   provider-specific keys).
   **Verify:** the code builds with no errors.

3. **Send a test email to the builder.** Send one real email to the builder's own address.
   **Verify:** ask them to confirm it arrived (check spam too). Don't continue until they say yes.
   🎉 *Celebrate* — the app can send email now.

4. **Connect it where it's needed.** Hook sending into the right moments — for example, the sign-in
   code email used by `add-signin`, a welcome email, or a receipt after a purchase.
   **Verify:** the connected email actually sends in that flow.

5. **Write a test** for the sending path, and keep it green.

## If anything breaks

Run `doctor`. Most issues are an unverified sender address or a missing access key — fix it for
them, don't explain the internals.

## Definition of done

A test email arrives, email is connected where the app needs it, and a passing test covers the
sending path.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
