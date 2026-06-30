import {
  lemonSqueezyConfigSchema,
  parseEnv,
  paymentsConfigSchema,
  paypalConfigSchema,
  resolveEnvProvider,
  stripeConfigSchema,
  type EnvSource,
} from '@vybekiit/core';
import { createLemonSqueezyProvider } from './providers/lemon-squeezy/index';
import { createPayPalProvider } from './providers/paypal/index';
import { createStripeProvider } from './providers/stripe/index';
import type { PaymentProvider } from './types';

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
  return resolveEnvProvider(
    PAYMENTS_PROVIDER,
    {
      stripe: (source) => createStripeProvider(parseEnv(stripeConfigSchema, source)),
      paypal: (source) => createPayPalProvider(parseEnv(paypalConfigSchema, source)),
      'lemon-squeezy': (source) =>
        createLemonSqueezyProvider(parseEnv(lemonSqueezyConfigSchema, source)),
    },
    env,
    'lemon-squeezy',
  );
}
