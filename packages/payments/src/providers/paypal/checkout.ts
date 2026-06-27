import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import { type PaypalConfig, type Result, fail, ok } from '@vybekiit/core';
import type { CheckoutParams, CheckoutResult } from '../../types';

/** Construct an SDK client bound to the configured sandbox/live environment. */
function paypalClient(config: PaypalConfig): Client {
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.PAYPAL_CLIENT_ID,
      oAuthClientSecret: config.PAYPAL_CLIENT_SECRET,
    },
    environment: config.PAYPAL_ENV === 'live' ? Environment.Production : Environment.Sandbox,
  });
}

/**
 * Create a PayPal order and return its approval URL.
 *
 * PayPal has no catalog primitive here, so `productId` is the price **amount**
 * string (e.g. `"29.00"`, USD). `githubUsername` is stored as the purchase unit's
 * `customId` so the webhook reads it back for the gate. The returned URL is the
 * HATEOAS `payer-action`/`approve` link the buyer is redirected to.
 */
export async function createPayPalCheckout(
  config: PaypalConfig,
  params: CheckoutParams,
): Promise<Result<CheckoutResult>> {
  const orders = new OrdersController(paypalClient(config));

  let url: string | undefined;
  try {
    const { result } = await orders.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: { currencyCode: 'USD', value: params.productId },
            customId: params.githubUsername,
          },
        ],
        applicationContext: {
          brandName: 'VybeKiit',
          returnUrl: params.successUrl,
          cancelUrl: params.cancelUrl ?? params.successUrl,
        },
      },
      prefer: 'return=representation',
    });
    url = result.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve')?.href;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    return fail('api_error', `PayPal could not create an order: ${detail}`);
  }

  if (!url) {
    return fail('invalid_response', 'PayPal did not return an approval URL.');
  }
  return ok({ url });
}
