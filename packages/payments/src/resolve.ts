import { type EnvSource, parseEnv, resolveEnvProvider } from '@vybekiit/core';
import { Context, Effect, Layer } from 'effect';
import {
  LemonSqueezyConfigSchema,
  PaymentsConfigSchema,
  PaypalConfigSchema,
  resolveLemonSqueezyEnv,
  StripeConfigSchema,
} from './config';
import { createLemonSqueezyProvider } from './providers/lemonSqueezy';
import { createPayPalProvider } from './providers/paypal';
import { createStripeProvider } from './providers/stripe';
import type { PaymentProvider } from './types';

/**
 * Construct the configured payment provider from the environment — the single call
 * site the checkout/webhook routes use, so they never name a vendor. Reads
 * `PAYMENTS_PROVIDER` (defaults to `lemon-squeezy`) and parses only that provider's
 * credentials, so an app configured for one provider never trips on another's
 * blank keys. The agent swaps providers by changing one env value.
 *
 * Lemon Squeezy test mode prefers `LEMONSQUEEZY_TEST_MODE_API_KEY` +
 * `LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET` so live keys stay for production.
 *
 * @param env - Environment variables used to select and configure the provider.
 * @returns The configured payment provider.
 * @throws If the selected provider config is invalid or no adapter is registered.
 * @example
 * const provider = resolvePaymentProvider(process.env);
 */
export const resolvePaymentProvider = (env: EnvSource = process.env): PaymentProvider => {
  const { PAYMENTS_PROVIDER } = parseEnv(PaymentsConfigSchema, env);
  return resolveEnvProvider(
    PAYMENTS_PROVIDER,
    {
      stripe: (source) => createStripeProvider(parseEnv(StripeConfigSchema, source)),
      paypal: (source) => createPayPalProvider(parseEnv(PaypalConfigSchema, source)),
      'lemon-squeezy': (source) =>
        createLemonSqueezyProvider(
          parseEnv(LemonSqueezyConfigSchema, resolveLemonSqueezyEnv(source)),
        ),
    },
    env,
    'lemon-squeezy',
  );
};

/** The payment provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Payments extends Context.Tag('@vybekiit/payments/Payments')<
  Payments,
  PaymentProvider
>() {}

/**
 * Build the live {@link Payments} layer from an environment source.
 *
 * @param env - Environment variables used by {@link resolvePaymentProvider}.
 * @returns A Layer that provides the configured {@link Payments} service.
 * @example
 * const layer = makePaymentsLive(process.env);
 */
export const makePaymentsLive = (env: EnvSource = process.env): Layer.Layer<Payments> =>
  Layer.effect(
    Payments,
    Effect.sync(() => resolvePaymentProvider(env)),
  );
