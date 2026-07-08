import type { PaypalConfig } from '@vybekiit/payments/config';
import type { PaymentProvider } from '@vybekiit/payments/types';
import { createPayPalCheckout } from './checkout';
import { parsePayPalWebhook } from './webhook';

/**
 * Build the PayPal {@link PaymentProvider}.
 *
 * @param config - Validated PayPal credentials and webhook id.
 * @returns A payment provider backed by PayPal orders and webhook verification.
 * @example
 * const provider = createPayPalProvider(config);
 */
export const createPayPalProvider = (config: PaypalConfig): PaymentProvider => ({
  name: 'paypal',
  createCheckout: (params) => createPayPalCheckout(config, params),
  parseWebhook: (rawBody, headers) => parsePayPalWebhook(config, rawBody, headers),
});
