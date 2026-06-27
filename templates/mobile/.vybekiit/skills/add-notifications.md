# Skill: add-notifications

**Goal:** users get notified when something important happens.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Notifications are sent from the **backend** via `@vybekiit/email`.
> Run **web** `setup-email` and `add-notifications` on the backend first; the phone app only
> triggers or displays in-app messages if needed.

## Steps

1. **Backend notifications first.** Run **web** `add-notifications` on the deployed backend.
   **Verify:** backend sends email on the agreed trigger.

2. **Optional in-app hints.** If the builder wants a banner on the phone when something happens,
   wire a lightweight poll or push stub later — email is v1.
   **Verify:** user receives the email when the flow runs.

3. **Celebrate.** 🎉 Users hear from the app when it matters.

## Definition of done

Backend notification fires for at least one user action the builder cares about.
