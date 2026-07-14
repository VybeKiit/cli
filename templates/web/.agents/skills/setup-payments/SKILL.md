---
name: setup-payments
description: the builder can take real money. By the end, a test purchase succeeds end-to-end. Use when the builder says something like: add payments; take money; sell something; charge people.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: setup-payments

**Goal:** the builder can take real money. By the end, a test purchase succeeds end-to-end.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire all the code; the builder only signs in once when asked.

> Why Lemon Squeezy is the default: it's the "merchant of record", which means **it handles sales
> tax/VAT for the builder** automatically.
>
> (Agent-only) Read `PAYMENTS_PROVIDER` and follow the matching platform wrapper:
> - default / `lemon-squeezy` → `platform-skills/lemon-squeezy-vybekiit.md`
> - `stripe` → `platform-skills/stripe-vybekiit.md`
> - `paypal` → `platform-skills/paypal-vybekiit.md`
> All paths use `@vybekiit/payments` → `resolvePaymentProvider()`.

## Steps

<!-- vybekiit:page-recipe-install -->
0. **Install the page recipe first (catalog SSOT — Option C).**
   Copy `apps/componentLibrary/src/pageRecipes/PricingPage.tsx` export `PricingPage` into the buyer app at route `/pricing`.
   Recipe id: `pricing`. Presets: orders + webhook_events (apply after provider secrets exist).
   Keep every `TODO:` in the recipe and wire each one after the route renders.
   Selling physical/digital goods (not only subscriptions)? Also install catalog ids
   `commerce-products`, `commerce-cart`, `commerce-checkout` via `getPageRecipeInstall`.
   Also reference `packages/agentKit` `getPageRecipeInstall('setup-payments')` / page-recipe-manifest.json.
   **Verify:** `/pricing` builds and shows practice plans before provider wiring.

1. **Explain the plan in one line.** *"I'll connect a payment service so you can charge people. I'll do
   the setup — you'll sign in once when I ask."* (Never name Lemon Squeezy, Stripe, or PayPal.)

2. **Lemon Squeezy (default) — sign-in only.**
   - Run `vybekiit-automate ls standby` (or wizard mode without `--json`).
   - Builder signs in at the payment dashboard (only manual step).
   - Builder says *"I'm in, proceed"*.
   - Run `vybekiit-automate ls setup --json` with name, price, mode, webhook URL from the conversation.
   - Write JSON output to `.env` (`LEMONSQUEEZY_STORE_ID`, variant ID, API key, webhook secret).
   **Verify:** values saved; product exists in test mode.

3. **Stripe (opt-in).** Merge `mcp-stripe.json` via `agent/mcp-setup.md`; builder OAuth once.
   Agent creates product/price via Stripe MCP; write restricted API key to `.env`.
   **Verify:** test mode product visible in Stripe dashboard.

4. **PayPal (opt-in).** Merge `mcp-paypal.json` via `agent/mcp-setup.md`; builder OAuth once (sandbox).
   Agent provisions via PayPal MCP; write client id/secret and webhook id to `.env`.
   **Verify:** sandbox checkout completes.

5. **Connect the automatic payment message (webhook).** Webhook URL is `/api/webhook` on the deployed app
   (`app/api/webhook/route.ts` → `src/lib/fulfillment.ts`). For LS, `ls setup` configures this when given
   `--webhook-url`.
   **Apply DB presets:** run `vybekiit apply-preset orders` and `vybekiit apply-preset webhook_events`
   (see `platform-skills/db-presets-vybekiit.md`). **Verify:** `vybekiit verify-presets orders webhook_events`.
   **Verify:** provider shows webhook connected.

6. **Test a purchase.** Use test mode for a fake purchase.
   **Verify:** order recorded (webhook success). 🎉 *Celebrate* — they can take money.

7. **Customize what a purchase does.** Ask what should happen when someone pays. Implement in
   `src/lib/fulfillment.ts`. Write a quick test and keep it green.

## If anything breaks

Run `doctor`. Common cause: webhook secret mismatch or values with extra spaces — fix it for them.

## Definition of done

A test purchase completes and does the right thing, with secrets saved and a passing test covering the flow.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
