# ADR-0027: Auth-owned Twilio SMS OTP vs notifications Twilio

## Status

Accepted — 2026-07-03

## Context

Twilio appears in two places:

1. **`@vybekiit/auth`** — SMS OTP for sign-in (`smsOtp.ts`, `twilioSchemas.ts`), wired into Better Auth and Cognito adapters.
2. **`@vybekiit/notifications`** — general notification channels (SMS, WhatsApp, push) via `NOTIFICATIONS_PROVIDER=twilio`.

Duplicating Twilio HTTP calls in both packages would drift (different error shapes, config keys, retry behavior).

## Decision

- **Auth owns OTP:** `@vybekiit/auth/smsOtp` is the only path for **verification codes during sign-in**. Config uses `twilioConfigSchema` from `@vybekiit/core`. Response parsing uses auth-local `twilioSchemas.ts` (Effect `Schema`).
- **Notifications owns outbound messaging:** Product notifications (alerts, marketing SMS, WhatsApp) go through `@vybekiit/notifications` Twilio adapter. Sign-in OTP must not call notifications.
- **Intentional duplication boundary:** notifications may keep its own Twilio client for non-OTP channels; do not merge OTP into notifications or vice versa without a new ADR.

Skills/docs reference `@vybekiit/auth` + `@vybekiit/notifications` separately (`sign-in-with-phone` vs `setup-sms`).

## Consequences

- Auth SMS changes touch `packages/auth/src/smsOtp.ts` only.
- Notification SMS changes touch `packages/notifications/src/providers/twilio` only.
- Env: Twilio credentials may be shared in `.env.example`, but each package reads only the keys its schema defines.

## References

- `packages/auth/src/smsOtp.ts`
- `packages/auth/src/twilioSchemas.ts`
- `packages/notifications/src/providers/twilio/`
