import type { LemonSqueezyConfig } from '@vybekiit/core';
import { fromResult, fromResultPromise } from '../../effect-bridge';
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
    createCheckout: (params) => fromResultPromise(createLemonSqueezyCheckout(config, params)),
    parseWebhook: (rawBody, headers) =>
      fromResult(
        parseLemonSqueezyWebhook(
          rawBody,
          headers['x-signature'] ?? '',
          config.LEMONSQUEEZY_WEBHOOK_SECRET,
        ),
      ),
  };
}
