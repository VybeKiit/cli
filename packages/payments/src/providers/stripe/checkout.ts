import type { StripeConfig } from '@vybekiit/payments/config';
import { caughtMessage, failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { CheckoutParams, CheckoutResult, PaymentError } from '@vybekiit/payments/types';
import { Effect } from 'effect';
import Stripe from 'stripe';

/**
 * Resolve the Stripe cancel URL from checkout params.
 *
 * @param params - Normalized checkout parameters.
 * @returns The explicit cancel URL, or the success URL when no cancel URL was supplied.
 * @example
 * const cancelUrl = resolveStripeCancelUrl(params);
 */
const resolveStripeCancelUrl = (params: CheckoutParams): string => {
  if (params.cancelUrl !== undefined && params.cancelUrl.length > 0) {
    return params.cancelUrl;
  }

  if (params.successUrl !== undefined && params.successUrl.length > 0) {
    return params.successUrl;
  }

  return '';
};

/**
 * Create a Stripe Checkout Session and return its hosted URL.
 *
 * @param config - Validated Stripe secret key and webhook secret.
 * @param params - Normalized checkout creation parameters.
 * @returns An Effect containing the hosted checkout URL.
 * @example
 * const checkout = await Effect.runPromise(createStripeCheckout(config, params));
 */
export const createStripeCheckout = (
  config: StripeConfig,
  params: CheckoutParams,
): Effect.Effect<CheckoutResult, PaymentError> =>
  Effect.gen(function* () {
    if (params.successUrl === undefined || params.successUrl.length === 0) {
      return yield* failPayment('config_missing', 'Stripe checkout requires a success URL.');
    }

    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
    const { successUrl } = params;

    const session = yield* Effect.tryPromise({
      try: () =>
        stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{ price: params.productId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: resolveStripeCancelUrl(params),
          ...(params.email ? { customer_email: params.email } : {}),
          ...(params.githubUsername
            ? { metadata: { github_username: params.githubUsername } }
            : {}),
        }),
      catch: (caught) =>
        paymentError(
          'api_error',
          `Stripe could not create a checkout: ${caughtMessage(caught, 'unknown error')}`,
        ),
    });

    const { url } = session;
    if (url === null || url.length === 0) {
      return yield* failPayment('invalid_response', 'Stripe did not return a checkout URL.');
    }
    return { url };
  });
