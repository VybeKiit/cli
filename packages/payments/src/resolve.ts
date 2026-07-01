import { type EnvSource, parseEnv, resolveEnvProvider } from '@vybekiit/core';
import { Context, Effect, Layer } from 'effect';
import {
  LemonSqueezyConfigSchema,
  PaymentsConfigSchema,
  PaypalConfigSchema,
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
 * @throws if the chosen provider's required keys are missing (via {@link parseEnv}) —
 *   a misconfigured store fails loud at boot, not deep in a request.
 */
export function resolvePaymentProvider(env: EnvSource = process.env): PaymentProvider {
  const { PAYMENTS_PROVIDER } = parseEnv(PaymentsConfigSchema, env);
  return resolveEnvProvider(
    PAYMENTS_PROVIDER,
    {
      stripe: (source) => createStripeProvider(parseEnv(StripeConfigSchema, source)),
      paypal: (source) => createPayPalProvider(parseEnv(PaypalConfigSchema, source)),
      'lemon-squeezy': (source) =>
        createLemonSqueezyProvider(parseEnv(LemonSqueezyConfigSchema, source)),
    },
    env,
    'lemon-squeezy',
  );
}

/** The payment provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Payments extends Context.Tag('@vybekiit/payments/Payments')<
  Payments,
  PaymentProvider
>() {}

/**
 * `Live` layer building {@link Payments} from the environment. Wraps the existing
 * {@link resolvePaymentProvider} factory, so config still fails loud when the layer
 * is built at a composition root.
 */
export function makePaymentsLive(env: EnvSource = process.env): Layer.Layer<Payments> {
  return Layer.effect(
    Payments,
    Effect.sync(() => resolvePaymentProvider(env)),
  );
}
