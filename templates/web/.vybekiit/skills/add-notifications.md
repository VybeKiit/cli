# Skill: add-notifications

**Goal:** the builder's users get notified — by email first; push can come later.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire sending; the builder describes when people should hear
from the app.

> (Under the hood — agent-only) Notifications via `@vybekiit/notifications` → `resolveNotificationsProvider()`
> (`src/lib/notifications-client.ts`). Email channel still needs `setup-email` first.

## Steps

1. **Confirm email works first.** If `setup-email` is not done, run that skill first.
   **Verify:** a test email arrives.

2. **Agree on what triggers a notification, in plain words.** Ask when users should get an email
   (e.g. "when someone joins their team", "when a payment succeeds"). You map triggers to code.
   **Verify:** read the list back and get a yes.

3. **Wire notification sending.** Hook `@vybekiit/email` into each agreed moment. Replace dashboard
   notification placeholder (`TODO(vybekiit): … — skill: add-notifications`).
   **Verify:** code builds.

4. **Send a real test notification.** Trigger one notification to the builder's own address in the
   flow they care about most.
   **Verify:** they confirm it arrived. 🎉 *Celebrate* — users get notified.

5. **Write a test** for at least one notification path and keep it green.

## If anything breaks

Run `doctor`. Most issues are email not set up or an unverified sender.

## Definition of done

At least one real notification sends in a user flow, and a passing test covers that path.
