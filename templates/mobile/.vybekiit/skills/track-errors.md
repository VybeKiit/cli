# Skill: track-errors

**Goal:** the builder gets alerted when the phone app crashes or hits a serious error in the wild.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Under the hood — agent-only) Same `@vybekiit/observability` headless adapter as web. Mobile uses
> `src/lib/observability.ts`. Follow `sentry-vybekiit.md` for dashboard steps; use Expo/Sentry native
> docs if the headless init needs a native layer beyond the shared provider.

## Steps

1. **Explain in one line.** *"I'm going to set up alerts so you know if the app crashes for your users."*

2. **Backend alerts first (recommended).** If the web backend isn't live yet, run web `go-live` or
   confirm the backend is online — many errors surface there first.

3. **Wire mobile alerts.** Set the same `.env` keys the web app uses when sharing one Sentry project:
   - `OBSERVABILITY_PROVIDER="sentry"`
   - `SENTRY_DSN="<from dashboard>"`
   Import `observability` from `src/lib/observability.ts` in the root error handler or crash boundary.
   **Verify:** app builds on device/simulator.

4. **Prove it works.** Trigger a dev-only test crash; confirm the event in the dashboard.
   **Verify:** builder sees confirmation in plain words.

5. **Celebrate.** 🎉 Alerts are on.

## Definition of done

Sentry DSN configured, test event received, builder knows they'll be notified.
