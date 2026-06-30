# Platform wrapper: Sentry (agent-only)

**Agent-only.** Invoked by buyer skill `track-errors` — not a buyer-facing name.

## Official upstream

- Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Package: `@vybekiit/observability` (Sentry adapter via `@sentry/core`)
- Pinned skills: `.agents/skills/sentry-sdk-setup/SKILL.md`, `.agents/skills/sentry-workflow/SKILL.md`

## Kit wiring

1. Set in `.env`:
   - `OBSERVABILITY_PROVIDER="sentry"`
   - `SENTRY_DSN="<from Sentry dashboard>"`
2. Confirm `instrumentation.ts` exists (calls `resolveObservabilityProvider`).
3. Confirm `src/lib/observability.ts` exports the provider.
4. Add a dev-only test route or button that throws once; verify alert in Sentry dashboard.
5. Wire `app/global-error.tsx` or route error boundaries to call `observability.captureException`.

## Builder manual step (one at a time)

1. Open the Sentry project the agent created (or have them sign up at sentry.io).
2. Copy the **DSN** from Project Settings → Client Keys.
3. Paste when the agent asks — never paste into chat.

## Verify-before-advance

Trigger test error → Sentry shows the event → tell builder "You'll get an email when something breaks."

## Mobile

Same `@vybekiit/observability` interface; Expo uses Sentry React Native SDK when the mobile track-errors skill runs — follow Expo Sentry docs for native init if needed beyond the headless provider.
