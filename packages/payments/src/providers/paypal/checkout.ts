import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import type { PaypalConfig } from '@vybekiit/payments/config';
import { caughtMessage, failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { CheckoutParams, CheckoutResult, PaymentError } from '@vybekiit/payments/types';
import { Effect } from 'effect';

/**
 * Resolve the PayPal SDK environment from validated config.
 *
 * @param config - Validated PayPal configuration.
 * @returns The PayPal SDK environment matching `PAYPAL_ENV`.
 * @example
 * const environment = resolvePayPalEnvironment(config);
 */
const resolvePayPalEnvironment = (config: PaypalConfig): Environment => {
  if (config.PAYPAL_ENV === 'live') {
    return Environment.Production;
  }

  return Environment.Sandbox;
};

/**
 * Construct a PayPal SDK client for the configured environment.
 *
 * @param config - Validated PayPal credentials.
 * @returns A PayPal SDK client.
 * @example
 * const client = paypalClient(config);
 */
const paypalClient = (config: PaypalConfig): Client =>
  new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.PAYPAL_CLIENT_ID,
      oAuthClientSecret: config.PAYPAL_CLIENT_SECRET,
    },
    environment: resolvePayPalEnvironment(config),
  });

/**
 * Resolve the PayPal cancel URL from checkout params.
 *
 * @param params - Normalized checkout parameters.
 * @returns The explicit cancel URL, success URL, or `null`.
 * @example
 * const cancelUrl = resolvePayPalCancelUrl(params);
 */
const resolvePayPalCancelUrl = (params: CheckoutParams): string | null => {
  if (params.cancelUrl !== undefined && params.cancelUrl.length > 0) {
    return params.cancelUrl;
  }

  if (params.successUrl !== undefined && params.successUrl.length > 0) {
    return params.successUrl;
  }

  return null;
};

/**
 * Create a PayPal order and return its approval URL.
 *
 * @param config - Validated PayPal credentials and environment.
 * @param params - Normalized checkout creation parameters.
 * @returns An Effect containing the hosted approval URL.
 * @example
 * const checkout = await Effect.runPromise(createPayPalCheckout(config, params));
 */
export const createPayPalCheckout = (
  config: PaypalConfig,
  params: CheckoutParams,
): Effect.Effect<CheckoutResult, PaymentError> =>
  Effect.gen(function* () {
    const orders = new OrdersController(paypalClient(config));

    const cancelUrl = resolvePayPalCancelUrl(params);
    const { result } = yield* Effect.tryPromise({
      try: () =>
        orders.createOrder({
          body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
              {
                amount: { currencyCode: 'USD', value: params.productId },
                ...(params.githubUsername ? { customId: params.githubUsername } : {}),
              },
            ],
            applicationContext: {
              brandName: 'VybeKiit',
              ...(params.successUrl ? { returnUrl: params.successUrl } : {}),
              ...(cancelUrl === null ? {} : { cancelUrl }),
            },
          },
          prefer: 'return=representation',
        }),
      catch: (caught) =>
        paymentError(
          'api_error',
          `PayPal could not create an order: ${caughtMessage(caught, 'unknown error')}`,
        ),
    });
    const url = result.links?.find(
      (link) => link.rel === 'payer-action' || link.rel === 'approve',
    )?.href;

    if (url === undefined || url.length === 0) {
      return yield* failPayment('invalid_response', 'PayPal did not return an approval URL.');
    }
    return { url };
  });
