import type { StripeConfig } from '@vybekiit/core';
import { fromResult, fromResultPromise } from '../../effectBridge';
import type { PaymentProvider } from '../../types';
import { createStripeCheckout } from './checkout';
import { parseStripeWebhook } from './webhook';

/**
 * Build the Stripe {@link PaymentProvider}. Note: with Stripe the *seller* is the
 * merchant of record, so they handle their own tax — unlike the Lemon Squeezy
 * default. The webhook signature header Stripe sends is `stripe-signature`.
 */
export function createStripeProvider(config: StripeConfig): PaymentProvider {
  return {
    name: 'stripe',
    createCheckout: (params) => fromResultPromise(createStripeCheckout(config, params)),
    parseWebhook: (rawBody, headers) =>
      fromResult(parseStripeWebhook(config, rawBody, headers['stripe-signature'] ?? '')),
  };
}
