import type { LemonSqueezyConfig } from '@vybekiit/core';
import type { PaymentProvider } from '../../types';
import { createLemonSqueezyCheckout } from './checkout';
import { parseLemonSqueezyWebhook } from './webhook';

/**
 * Build the Lemon Squeezy {@link PaymentProvider} — VybeKiit's v1 default, because
 * Lemon Squeezy is a Merchant of Record (it collects/remits sales tax/VAT for the
 * seller). The webhook signature header LS sends is `x-signature`.
 */
export function createLemonSqueezyProvider(config: LemonSqueezyConfig): PaymentProvider {
  return {
    name: 'lemon-squeezy',
    createCheckout: (params) => createLemonSqueezyCheckout(config, params),
    parseWebhook: (rawBody, headers) =>
      Promise.resolve(
        parseLemonSqueezyWebhook(
          rawBody,
          headers['x-signature'] ?? '',
          config.LEMONSQUEEZY_WEBHOOK_SECRET,
        ),
      ),
  };
}
