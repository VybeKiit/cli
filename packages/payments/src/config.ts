import { Schema } from 'effect';

/**
 * Payments configuration — per-concern `Schema.Struct` (ADR-0022 config split,
 * ADR-0023 Schema). Parsed via core's `parseEnv`; the root `.env.example` stays the
 * single source of truth for the keys themselves.
 */

/** Which payment adapter runs — swapped via `PAYMENTS_PROVIDER` (ADR-0018). */
export const PaymentsConfigSchema = Schema.Struct({
  PAYMENTS_PROVIDER: Schema.optionalWith(Schema.Literal('lemon-squeezy', 'stripe', 'paypal'), {
    default: () => 'lemon-squeezy' as const,
  }),
});
export type PaymentsConfig = Schema.Schema.Type<typeof PaymentsConfigSchema>;

/** A `true`/`false` env string decoded to a boolean; blank/absent means `false`. */
const BooleanFromEnv = Schema.transform(Schema.Literal('true', 'false'), Schema.Boolean, {
  strict: true,
  decode: (value) => value === 'true',
  encode: (value) => (value ? ('true' as const) : ('false' as const)),
});

/** Lemon Squeezy credentials — the lemon-squeezy adapter (v1 default Merchant of Record). */
export const LemonSqueezyConfigSchema = Schema.Struct({
  LEMONSQUEEZY_API_KEY: Schema.String.pipe(Schema.minLength(1)),
  LEMONSQUEEZY_STORE_ID: Schema.String.pipe(Schema.minLength(1)),
  LEMONSQUEEZY_WEBHOOK_SECRET: Schema.String.pipe(Schema.minLength(1)),
  LEMONSQUEEZY_TEST_MODE: Schema.optionalWith(BooleanFromEnv, { default: () => false }),
});
export type LemonSqueezyConfig = Schema.Schema.Type<typeof LemonSqueezyConfigSchema>;

/** Stripe credentials — the stripe adapter. */
export const StripeConfigSchema = Schema.Struct({
  STRIPE_SECRET_KEY: Schema.String.pipe(Schema.minLength(1)),
  STRIPE_WEBHOOK_SECRET: Schema.String.pipe(Schema.minLength(1)),
});
export type StripeConfig = Schema.Schema.Type<typeof StripeConfigSchema>;

/** PayPal credentials — the paypal adapter (verifies webhooks server-side by `PAYPAL_WEBHOOK_ID`). */
export const PaypalConfigSchema = Schema.Struct({
  PAYPAL_CLIENT_ID: Schema.String.pipe(Schema.minLength(1)),
  PAYPAL_CLIENT_SECRET: Schema.String.pipe(Schema.minLength(1)),
  PAYPAL_WEBHOOK_ID: Schema.String.pipe(Schema.minLength(1)),
  PAYPAL_ENV: Schema.optionalWith(Schema.Literal('sandbox', 'live'), {
    default: () => 'sandbox' as const,
  }),
});
export type PaypalConfig = Schema.Schema.Type<typeof PaypalConfigSchema>;
