import type { PaypalConfig } from '@vybekiit/core';
import { fromResultPromise } from '@vybekiit/payments/effectBridge';
import type { PaymentProvider } from '@vybekiit/payments/types';
import { createPayPalCheckout } from './checkout';
import { parsePayPalWebhook } from './webhook';

/**
 * Build the PayPal {@link PaymentProvider}. PayPal verifies webhooks server-side
 * (an API round-trip), so its `parseWebhook` is the one adapter that genuinely
 * awaits — the returned `Effect` carries that async work.
 */
export function createPayPalProvider(config: PaypalConfig): PaymentProvider {
  return {
    name: 'paypal',
    createCheckout: (params) => fromResultPromise(createPayPalCheckout(config, params)),
    parseWebhook: (rawBody, headers) =>
      fromResultPromise(parsePayPalWebhook(config, rawBody, headers)),
  };
}
