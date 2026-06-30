# Skill: reset-password

**Goal:** people who forgot their password can get a reset link and set a new one.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Agent-only) Routes: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` (web) or
> backend `/auth/forgot-password`, `/auth/reset-password`. Uses `resolveAuthProvider()` reset methods.

## Steps

1. **Confirm sign-in is wired.** Run `add-signin` first if accounts are not set up yet.
   **Verify:** existing sign-in works.

2. **Wire the forgot-password screen** to `POST /api/auth/forgot-password` with `{ email }`.
   **Verify:** practice mode returns success without real mail.

3. **Wire the reset screen** (link with token) to `POST /api/auth/reset-password` with
   `{ token, newPassword }`. On success, land signed in on the dashboard.
   **Verify:** local dev accepts token `local-reset-token`.

4. **When going live:** ensure email delivery is configured (`setup-email`) so reset links send.
   **Verify:** real inbox receives the link.

5. **Append checklist entry** via `formatChecklistEntry` (password reset flow enabled).

## If anything breaks

Run `doctor`. If MCP or Twilio/email tools fail once, run `vybekiit doc-fallback better-auth` and
tell the builder: *"I'm double-checking the official setup guide for this — hang tight, I'll have
the next step in a moment."*

## Definition of done

Forgot → reset → signed in works in practice mode; checklist updated.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

