# Platform wrapper: Lemon Squeezy (default payments)

**Agent-only.** Invoked by buyer skill `setup-payments`.

## Official upstream

- Docs: https://docs.lemonsqueezy.com
- **Freshness note:** `@lemonsqueezy/lemonsqueezy.js` npm publish is stale (Nov 2024) — no vendor skills.sh repo. Rely on `@vybekiit/payments` adapter + `browser-automation-vybekiit.md`; check https://docs.lemonsqueezy.com/help/changelog before API changes.

## Kit wiring

1. Payments via `@vybekiit/payments` → `resolvePaymentProvider()` (LS when `PAYMENTS_PROVIDER` default)
2. Dashboard provisioning via `@vybekiit/browser-automation` **`ls` target** (codename fresh-squeezy):
   - `vybekiit-automate ls standby` — builder signs in only (`$HOME/.ls-chrome-profile`)
   - `vybekiit-automate ls setup --json --name … --price-cents … --mode test|live --webhook-url …`
3. Write CLI JSON to `.env`: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, variant ID, webhook secret
4. Webhook route at `app/api/webhook/route.ts`; fulfillment in `src/lib/fulfillment.ts`
5. Replace `TODO(vybekiit): … — skill: setup-payments` markers

See also `platform-skills/browser-automation-vybekiit.md` for CLI modes (`--json` vs wizard).

## Verify-before-advance

- Test checkout opens; webhook receives event (test mode OK)
- Order recorded in database; builder sees success in app

## Selector registry

LS DOM selectors live in `@vybekiit/browser-automation` `targets/lemon-squeezy/selectors/`. If setup throws
`SelectorMissingError`, update registry from a recorded session (maintainer pass).
