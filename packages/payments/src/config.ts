import type { EnvSource } from '@vybekiit/core';
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

/**
 * Whether an env value is present and non-blank after trim.
 *
 * @param value - Raw env string or undefined.
 * @returns The trimmed value, or `undefined` when blank/absent.
 * @example
 * nonEmptyEnv('  abc  ') // → 'abc'
 */
const nonEmptyEnv = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Map live vs test Lemon Squeezy credentials into the schema keys.
 *
 * When `LEMONSQUEEZY_TEST_MODE=true` **and** `LEMONSQUEEZY_TEST_MODE_API_KEY` is set,
 * checkout + webhook verification use the test key and
 * `LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET` so production
 * `LEMONSQUEEZY_API_KEY` / `LEMONSQUEEZY_WEBHOOK_SECRET` stay untouched.
 * Live mode always uses the live keys only — test keys are never read.
 *
 * @param env - Raw process env (or a test double).
 * @returns An env slice ready for {@link LemonSqueezyConfigSchema}.
 * @example
 * parseEnv(LemonSqueezyConfigSchema, resolveLemonSqueezyEnv(process.env));
 */
export const resolveLemonSqueezyEnv = (env: EnvSource = process.env): EnvSource => {
  const testMode = env.LEMONSQUEEZY_TEST_MODE === 'true';
  const testApiKey = nonEmptyEnv(env.LEMONSQUEEZY_TEST_MODE_API_KEY);
  const testWebhookSecret = nonEmptyEnv(env.LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET);

  if (testMode && testApiKey !== undefined) {
    return {
      LEMONSQUEEZY_API_KEY: testApiKey,
      LEMONSQUEEZY_STORE_ID: env.LEMONSQUEEZY_STORE_ID,
      // No live-secret fallback: test webhooks are signed with the test secret only.
      LEMONSQUEEZY_WEBHOOK_SECRET: testWebhookSecret,
      LEMONSQUEEZY_TEST_MODE: 'true',
    };
  }

  return {
    LEMONSQUEEZY_API_KEY: env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_STORE_ID: env.LEMONSQUEEZY_STORE_ID,
    LEMONSQUEEZY_WEBHOOK_SECRET: env.LEMONSQUEEZY_WEBHOOK_SECRET,
    LEMONSQUEEZY_TEST_MODE: testMode ? 'true' : (env.LEMONSQUEEZY_TEST_MODE ?? 'false'),
  };
};

/**
 * Resolve which store variant id to sell: test product when test-mode keys are active,
 * otherwise the live {@link STORE_PRODUCT_ID}.
 *
 * @param env - Raw process env (or a test double).
 * @returns The variant id string to pass to checkout, or `undefined` when unset.
 * @example
 * const productId = resolveStoreProductId(process.env) ?? parseEnv(storeConfigSchema).STORE_PRODUCT_ID;
 */
export const resolveStoreProductId = (env: EnvSource = process.env): string | undefined => {
  const testMode = env.LEMONSQUEEZY_TEST_MODE === 'true';
  const testApiKey = nonEmptyEnv(env.LEMONSQUEEZY_TEST_MODE_API_KEY);
  const testProductId = nonEmptyEnv(env.LEMONSQUEEZY_TEST_MODE_STORE_PRODUCT_ID);
  if (testMode && testApiKey !== undefined && testProductId !== undefined) {
    return testProductId;
  }
  return nonEmptyEnv(env.STORE_PRODUCT_ID);
};

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
