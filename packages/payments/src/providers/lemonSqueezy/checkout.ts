import {
  createCheckout as createLemonSqueezyHostedCheckout,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';
import { fail, type LemonSqueezyConfig, ok, type Result } from '@vybekiit/core';
import type { CheckoutParams, CheckoutResult } from '@vybekiit/payments/types';

/**
 * Create a hosted Lemon Squeezy checkout and return its URL.
 *
 * `githubUsername` is sent as checkout `custom` data so the order webhook reads it
 * back and the gate invites that exact account — this links a payment to the right
 * GitHub user with no account system of our own. Returns a {@link Result}: a bad
 * key / unknown variant / network blip is an expected boundary failure the caller
 * surfaces, not a thrown crash.
 */
export async function createLemonSqueezyCheckout(
  config: LemonSqueezyConfig,
  params: CheckoutParams,
): Promise<Result<CheckoutResult>> {
  lemonSqueezySetup({ apiKey: config.LEMONSQUEEZY_API_KEY });

  const variantId = Number(params.productId);
  const testMode = config.LEMONSQUEEZY_TEST_MODE ?? false;

  let url: string | undefined;
  try {
    const response = await createLemonSqueezyHostedCheckout(
      config.LEMONSQUEEZY_STORE_ID,
      params.productId,
      {
        testMode,
        productOptions: {
          enabledVariants: [variantId],
          ...(params.successUrl ? { redirectUrl: params.successUrl } : {}),
        },
        checkoutData: {
          ...(params.email ? { email: params.email } : {}),
          ...(params.githubUsername ? { custom: { github_username: params.githubUsername } } : {}),
        },
      },
    );
    if (response.error) {
      return fail('api_error', response.error.message);
    }
    url = response.data?.data.attributes.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach Lemon Squeezy: ${detail}`);
  }

  if (!url) {
    return fail('invalid_response', 'Lemon Squeezy did not return a checkout URL.');
  }
  return ok({ url });
}
