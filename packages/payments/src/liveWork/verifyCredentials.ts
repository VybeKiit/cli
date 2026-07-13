import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import type { PaymentsLadderProvider } from './types';
import { makeProvisionedPayments, PaymentsLiveWorkError, type ProvisionedPayments } from './types';

/**
 * Non-empty trimmed env value, or undefined.
 *
 * @param env - Raw environment.
 * @param key - Env key.
 * @returns Trimmed value when present.
 */
const envNonEmpty = (env: EnvSource, key: string): string | undefined => {
  const raw = env[key];
  if (typeof raw !== 'string') {
    return;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Whether Lemon Squeezy has the credential set Live work needs.
 * Accepts live keys or test-mode keys when `LEMONSQUEEZY_TEST_MODE=true`.
 *
 * @param env - Raw environment.
 * @returns True when API key + store + webhook secret are present.
 * @example
 * hasLemonSqueezyCredentials({ LEMONSQUEEZY_API_KEY: 'x', LEMONSQUEEZY_STORE_ID: '1', LEMONSQUEEZY_WEBHOOK_SECRET: 's' });
 */
export const hasLemonSqueezyCredentials = (env: EnvSource): boolean => {
  const testMode = env.LEMONSQUEEZY_TEST_MODE === 'true';
  const testKey = envNonEmpty(env, 'LEMONSQUEEZY_TEST_MODE_API_KEY');
  if (testMode && testKey !== undefined) {
    return (
      envNonEmpty(env, 'LEMONSQUEEZY_STORE_ID') !== undefined &&
      envNonEmpty(env, 'LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET') !== undefined
    );
  }
  return (
    envNonEmpty(env, 'LEMONSQUEEZY_API_KEY') !== undefined &&
    envNonEmpty(env, 'LEMONSQUEEZY_STORE_ID') !== undefined &&
    envNonEmpty(env, 'LEMONSQUEEZY_WEBHOOK_SECRET') !== undefined
  );
};

/**
 * Whether Stripe has secret + webhook secret.
 *
 * @param env - Raw environment.
 * @returns True when both keys are present.
 * @example
 * hasStripeCredentials({ STRIPE_SECRET_KEY: 'sk', STRIPE_WEBHOOK_SECRET: 'whsec' });
 */
export const hasStripeCredentials = (env: EnvSource): boolean =>
  envNonEmpty(env, 'STRIPE_SECRET_KEY') !== undefined &&
  envNonEmpty(env, 'STRIPE_WEBHOOK_SECRET') !== undefined;

/**
 * Whether PayPal has client id, secret, and webhook id.
 *
 * @param env - Raw environment.
 * @returns True when all three are present.
 * @example
 * hasPaypalCredentials({ PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 's', PAYPAL_WEBHOOK_ID: 'w' });
 */
export const hasPaypalCredentials = (env: EnvSource): boolean =>
  envNonEmpty(env, 'PAYPAL_CLIENT_ID') !== undefined &&
  envNonEmpty(env, 'PAYPAL_CLIENT_SECRET') !== undefined &&
  envNonEmpty(env, 'PAYPAL_WEBHOOK_ID') !== undefined;

/**
 * Whether the named provider has the credential set Live work treats as "configured".
 *
 * @param provider - Ladder provider.
 * @param env - Raw environment.
 * @returns True when required keys exist (not a live network verify).
 * @example
 * hasPaymentsCredentials('stripe', { STRIPE_SECRET_KEY: 'sk', STRIPE_WEBHOOK_SECRET: 'whsec' });
 */
export const hasPaymentsCredentials = (
  provider: PaymentsLadderProvider,
  env: EnvSource,
): boolean => {
  if (provider === 'lemon-squeezy') {
    return hasLemonSqueezyCredentials(env);
  }
  if (provider === 'stripe') {
    return hasStripeCredentials(env);
  }
  return hasPaypalCredentials(env);
};

/**
 * Detect an already-working payments pin (ADR-0039: existing wins).
 * Requires PAYMENTS_PROVIDER on the ladder **and** that provider's keys present.
 *
 * @param env - Raw environment.
 * @returns Provisioned snapshot or null.
 * @example
 * detectExistingPayments({ PAYMENTS_PROVIDER: 'stripe', STRIPE_SECRET_KEY: 'sk', STRIPE_WEBHOOK_SECRET: 'whsec' });
 */
export const detectExistingPayments = (env: EnvSource): ProvisionedPayments | null => {
  const pin = typeof env.PAYMENTS_PROVIDER === 'string' ? env.PAYMENTS_PROVIDER : null;
  if (pin !== 'lemon-squeezy' && pin !== 'stripe' && pin !== 'paypal') {
    return null;
  }
  if (!hasPaymentsCredentials(pin, env)) {
    return null;
  }
  return makeProvisionedPayments(pin);
};

/**
 * Verify credentials for one ladder entry (env presence; optional live probe later).
 * Missing keys → hop-class `missing_credentials`.
 *
 * @param provider - Ladder entry to try.
 * @param env - Raw environment.
 * @returns Effect of verified provisioned payments or hop-classed error.
 * @example
 * await Effect.runPromise(verifyPaymentsCredentials('stripe', env));
 */
export const verifyPaymentsCredentials = (
  provider: PaymentsLadderProvider,
  env: EnvSource,
): Effect.Effect<ProvisionedPayments, PaymentsLiveWorkError> => {
  if (!hasPaymentsCredentials(provider, env)) {
    return Effect.fail(
      new PaymentsLiveWorkError({
        code: 'missing_credentials',
        message: `${provider} credentials not configured`,
        hopClass: 'missing_credentials',
        provider,
      }),
    );
  }
  return Effect.succeed(makeProvisionedPayments(provider));
};
