import type { LemonSqueezyConfig } from '@vybekiit/payments/config';
import { failPayment } from '@vybekiit/payments/paymentEffect';
import type { PaymentProvider } from '@vybekiit/payments/types';
import { createLemonSqueezyCheckout } from './checkout';
import { parseLemonSqueezyWebhook } from './webhook';

/**
 * Build the Lemon Squeezy {@link PaymentProvider}.
 *
 * @param config - Validated Lemon Squeezy credentials and webhook secret.
 * @returns A payment provider backed by Lemon Squeezy checkout and webhooks.
 * @example
 * const provider = createLemonSqueezyProvider(config);
 */
export const createLemonSqueezyProvider = (config: LemonSqueezyConfig): PaymentProvider => ({
  name: 'lemon-squeezy',
  createCheckout: (params) => createLemonSqueezyCheckout(config, params),
  parseWebhook: (rawBody, headers) => {
    const signature = headers['x-signature'];
    if (signature === undefined || signature.length === 0) {
      return failPayment('invalid_signature', 'Missing Lemon Squeezy signature header.');
    }

    return parseLemonSqueezyWebhook(rawBody, signature, config.LEMONSQUEEZY_WEBHOOK_SECRET);
  },
});
