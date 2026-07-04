# Skill: setup-sms

**Goal:** text messages (and optional WhatsApp) work for sign-in codes and alerts.

**Contract:** one action at a time · verify-before-advance · plain language · translate errors · celebrate.

> (Agent-only) Merge `mcp-twilio-docs.json` and optionally `mcp-twilio-alpha.json`. Env keys in
> `.env.example` with `# Docs:` links. Provider: `@vybekiit/notifications` Twilio adapter.

## Steps

1. **Collect Twilio secret settings** through doctor (never ask the builder to type SIDs by hand):
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Optional:
   `TWILIO_VERIFY_SERVICE_SID`, `TWILIO_WHATSAPP_FROM`.
   **Verify:** values saved to `.env`.

2. **Set `NOTIFICATIONS_PROVIDER=twilio`.**
   **Verify:** `resolveNotificationsProvider()` does not throw.

3. **Merge Twilio MCP snippets** per `mcp-setup.md` for your assistant client.
   **Verify:** docs MCP connects, or on failure run `vybekiit doc-fallback twilio`.

4. **Send a test code** via `sign-in-with-phone` or a smoke call to Verify/Messaging API.
   **Verify:** message received or practice code `000000` works locally.

5. **Append checklist entry** (SMS provider wired).

## If MCP or first debug fails once

Run `vybekiit doc-fallback twilio` (JSON with official URLs). Tell the builder:
*"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a
moment."*

## Definition of done

Twilio env filled; notifications provider resolves; test send works; checklist updated.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

