import {
  createCheckout as createLemonSqueezyHostedCheckout,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';
import type { LemonSqueezyConfig } from '@vybekiit/payments/config';
import { caughtMessage, failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { CheckoutParams, CheckoutResult, PaymentError } from '@vybekiit/payments/types';
import { Effect } from 'effect';

/**
 * Create a hosted Lemon Squeezy checkout and return its URL.
 *
 * @param config - Validated Lemon Squeezy credentials and test-mode flag.
 * @param params - Normalized checkout creation parameters.
 * @returns An Effect containing the hosted checkout URL.
 * @example
 * const checkout = await Effect.runPromise(createLemonSqueezyCheckout(config, params));
 */
export const createLemonSqueezyCheckout = (
  config: LemonSqueezyConfig,
  params: CheckoutParams,
): Effect.Effect<CheckoutResult, PaymentError> =>
  Effect.gen(function* () {
    lemonSqueezySetup({ apiKey: config.LEMONSQUEEZY_API_KEY });

    const variantId = Number(params.productId);
    const testMode = config.LEMONSQUEEZY_TEST_MODE;

    const response = yield* Effect.tryPromise({
      try: () =>
        createLemonSqueezyHostedCheckout(config.LEMONSQUEEZY_STORE_ID, params.productId, {
          testMode,
          ...(params.customPriceCents === undefined
            ? {}
            : { customPrice: params.customPriceCents }),
          productOptions: {
            enabledVariants: [variantId],
            ...(params.successUrl ? { redirectUrl: params.successUrl } : {}),
          },
          checkoutData: {
            ...(params.email ? { email: params.email } : {}),
            ...(params.githubUsername
              ? { custom: { github_username: params.githubUsername } }
              : {}),
          },
        }),
      catch: (caught) =>
        paymentError(
          'network_error',
          `Lemon Squeezy could not create a checkout: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });

    if (response.error) {
      return yield* failPayment('api_error', response.error.message);
    }

    const responseData = response.data;
    if (responseData === undefined) {
      return yield* failPayment('invalid_response', 'Lemon Squeezy did not return a checkout URL.');
    }

    const {
      data: {
        attributes: { url },
      },
    } = responseData;
    if (url.length === 0) {
      return yield* failPayment('invalid_response', 'Lemon Squeezy did not return a checkout URL.');
    }
    return { url };
  });
