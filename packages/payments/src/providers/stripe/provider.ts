import type { StripeConfig } from '@vybekiit/payments/config';
import { failPayment } from '@vybekiit/payments/paymentEffect';
import type { PaymentProvider } from '@vybekiit/payments/types';
import { createStripeCheckout } from './checkout';
import { parseStripeWebhook } from './webhook';

/**
 * Build the Stripe {@link PaymentProvider}.
 *
 * @param config - Validated Stripe secret key and webhook secret.
 * @returns A payment provider backed by Stripe Checkout and webhooks.
 * @example
 * const provider = createStripeProvider(config);
 */
export const createStripeProvider = (config: StripeConfig): PaymentProvider => ({
  name: 'stripe',
  createCheckout: (params) => createStripeCheckout(config, params),
  parseWebhook: (rawBody, headers) => {
    const signature = headers['stripe-signature'];
    if (signature === undefined || signature.length === 0) {
      return failPayment('invalid_signature', 'Missing Stripe signature header.');
    }

    return parseStripeWebhook(config, rawBody, signature);
  },
});
