import {
  lemonSqueezyConfigSchema,
  parseEnv,
  paymentsConfigSchema,
  paypalConfigSchema,
  stripeConfigSchema,
} from '@vybekiit/core';
import { createLemonSqueezyProvider } from './providers/lemon-squeezy';
import { createPayPalProvider } from './providers/paypal';
import { createStripeProvider } from './providers/stripe';
import type { PaymentProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * Construct the configured payment provider from the environment — the single call
 * site the checkout/webhook routes use, so they never name a vendor. Reads
 * `PAYMENTS_PROVIDER` (defaults to `lemon-squeezy`) and parses only that provider's
 * credentials, so an app configured for one provider never trips on another's
 * blank keys. The agent swaps providers by changing one env value.
 *
 * @throws if the chosen provider's required keys are missing (via {@link parseEnv}).
 */
export function resolvePaymentProvider(env: EnvSource = process.env): PaymentProvider {
  const { PAYMENTS_PROVIDER } = parseEnv(paymentsConfigSchema, env);
  switch (PAYMENTS_PROVIDER) {
    case 'stripe':
      return createStripeProvider(parseEnv(stripeConfigSchema, env));
    case 'paypal':
      return createPayPalProvider(parseEnv(paypalConfigSchema, env));
    default:
      return createLemonSqueezyProvider(parseEnv(lemonSqueezyConfigSchema, env));
  }
}
