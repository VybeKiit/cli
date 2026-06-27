# Skill: setup-payments

**Goal:** the builder can take real money in the app. By the end, a test purchase succeeds.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only confirms when asked.

> (Under the hood — agent-only) The simplest compliant path on a phone is to open the **hosted
> checkout page in the browser** — the device never touches payment keys. `src/lib/billing-client.ts`
> already opens the returned URL with `Linking.openURL`; wire `startCheckout` to ask the **backend**
> (`POST /api/checkout` over `APP_URL`, via `postJson`) for the real checkout URL. The backend owns
> the payment provider (its own setup-payments skill does that). Native in-app purchase (StoreKit /
> Play Billing) is a separate, heavier path — out of scope here. Never name the provider to the
> builder.

## Steps

1. **Make sure the backend can take money first.** Payments are set up on the builder's web app. If
   the web side doesn't have payments yet, run the **web** setup-payments skill over there first, then
   come back.
   **Verify:** the backend returns a working checkout URL, and `APP_URL` in `.env` points at that
   deployed backend.

2. **Explain the plan in one line.** *"When someone taps a plan, I'll open the secure payment page in
   their browser — that's the safest way to take money in an app."*

3. **Wire the checkout.** In `src/lib/billing-client.ts`, replace the stubbed `startCheckout` with a
   call that asks the backend for the checkout URL and returns it (this resolves the
   `TODO(vybekiit): … — skill: setup-payments` markers; grep them). The pricing screen already opens
   that URL.
   **Verify:** the code builds; tapping a plan opens the real payment page.

4. **Test a purchase.** Use the backend's test mode to make a fake purchase from the app.
   **Verify:** the test purchase completes and the backend records the order.
   🎉 *Celebrate* — they can take money in the app.

5. **Mention what's next, don't build it.** Let them know that paying *inside* the app itself (no
   browser) is possible later if they need it — it's a bigger, separate setup, so leave it for now.

## If anything breaks

Run `doctor`. The usual causes are the backend address (`APP_URL`) not pointing at the deployed web
app, or the backend not having payments yet — fix the one cause for them, don't explain the internals.

## Definition of done

Tapping a plan opens the real checkout, a test purchase completes against the backend, and no
setup-payments markers remain (re-grep `TODO(vybekiit)`).
