import type { PaypalConfig } from '@vybekiit/core';
import type { PaymentProvider } from '../../types';
import { createPayPalCheckout } from './checkout';
import { parsePayPalWebhook } from './webhook';

/**
 * Build the PayPal {@link PaymentProvider}. PayPal verifies webhooks server-side
 * (an API round-trip), so its `parseWebhook` is the one adapter that genuinely
 * awaits — the interface is async precisely to accommodate this.
 */
export function createPayPalProvider(config: PaypalConfig): PaymentProvider {
  return {
    name: 'paypal',
    createCheckout: (params) => createPayPalCheckout(config, params),
    parseWebhook: (rawBody, headers) => parsePayPalWebhook(config, rawBody, headers),
  };
}
