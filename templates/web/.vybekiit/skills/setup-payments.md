# Skill: setup-payments

**Goal:** the builder can take real money. By the end, a test purchase succeeds end-to-end.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only pastes a few values when asked.

> Why Lemon Squeezy is the default: it's the "merchant of record", which means **it handles sales
> tax/VAT for the builder** — the scary part — automatically. Don't make the builder think about tax.
>
> (Agent-only) Read `PAYMENTS_PROVIDER` and follow the matching platform wrapper:
> - default / `lemon-squeezy` → `platform-skills/lemon-squeezy-vybekiit.md`
> - `stripe` → `platform-skills/stripe-vybekiit.md`
> - `paypal` → `platform-skills/paypal-vybekiit.md`
> All paths use `@vybekiit/payments` → `resolvePaymentProvider()`.

## Steps

1. **Explain the plan in one line.** *"I'll connect a payment service so you can charge people. I'll do
   the setup — you'll paste me a few values when I ask."* (Never name Lemon Squeezy, Stripe, or PayPal.)

2. **Account + product.** Guide them to create an account and one product (one step at a time, where
   to click). You decide sensible defaults; they decide the price.
   **Verify:** the product exists.

3. **Collect the required values, one at a time.** Which keys depend on the provider (see the wrapper).
   For Lemon Squeezy (default), collect:
   - the API password (`LEMONSQUEEZY_API_KEY`)
   - the store number (`LEMONSQUEEZY_STORE_ID`)
   - the webhook secret (`LEMONSQUEEZY_WEBHOOK_SECRET`)
   **Verify after each:** confirm it's saved before asking for the next.

4. **Connect the automatic payment message (webhook).** Set the webhook URL to the app's
   `/api/webhook`. The code is already there (`app/api/webhook/route.ts` → `src/lib/fulfillment.ts`).
   **Verify:** the provider shows the webhook as connected.

5. **Test a purchase.** Use the provider's test mode to make a fake purchase.
   **Verify:** the order is recorded (the webhook returned success). 🎉 *Celebrate* — they can take
   money.

6. **Customize what a purchase does.** Ask what should happen when someone pays (unlock a page,
   send something). Implement it in `src/lib/fulfillment.ts`. Write a quick test and keep it green.

## If anything breaks

Run `doctor`. Common cause: a value pasted with extra spaces, or the webhook secret mismatched —
fix it for them, don't explain the internals.

## Definition of done

A test purchase completes and does the right thing, with the secret values saved and a passing test
covering the purchase flow.
