import {
  createCheckout as createLemonSqueezyHostedCheckout,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';
import { type LemonSqueezyConfig, type Result, fail, ok } from '@vybekiit/core';
import type { CheckoutParams, CheckoutResult } from '../../types';

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

  let url: string | undefined;
  try {
    const response = await createLemonSqueezyHostedCheckout(
      config.LEMONSQUEEZY_STORE_ID,
      params.productId,
      {
        checkoutData: {
          email: params.email,
          custom: params.githubUsername ? { github_username: params.githubUsername } : undefined,
        },
        productOptions: params.successUrl ? { redirectUrl: params.successUrl } : undefined,
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
