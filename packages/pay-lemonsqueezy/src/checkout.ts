import {
  LEMONSQUEEZY_API_BASE,
  type LemonSqueezyConfig,
  type Result,
  fail,
  ok,
} from '@vybekiit/core';
import { z } from 'zod';

/**
 * Inputs for creating a hosted Lemon Squeezy checkout.
 *
 * `githubUsername` is stored as checkout custom data so the order webhook can read
 * it back and the gate can invite that exact account — this is what links a
 * payment to the right GitHub user without any account system of our own.
 */
export interface CreateCheckoutParams {
  /** Lemon Squeezy variant (product) id being sold. */
  readonly variantId: string;
  /** Buyer's GitHub username — round-tripped to the webhook as custom data. */
  readonly githubUsername?: string;
  /** Pre-fill the buyer's email on the checkout. */
  readonly email?: string;
  /** Where Lemon Squeezy sends the buyer after a successful purchase. */
  readonly redirectUrl?: string;
}

const checkoutResponseSchema = z.object({
  data: z.object({
    attributes: z.object({ url: z.string().url() }),
  }),
});

/**
 * Create a hosted checkout and return its URL.
 *
 * Returns a {@link Result}: a failed API call (bad key, unknown variant, network)
 * is an expected boundary failure the caller surfaces, not a thrown crash. Uses
 * the global `fetch` (Node ≥ 20) — no HTTP client dependency needed.
 */
export async function createCheckout(
  config: LemonSqueezyConfig,
  params: CreateCheckoutParams,
): Promise<Result<{ url: string }>> {
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: params.email,
          custom: params.githubUsername ? { github_username: params.githubUsername } : undefined,
        },
        product_options: params.redirectUrl ? { redirect_url: params.redirectUrl } : undefined,
      },
      relationships: {
        store: { data: { type: 'stores', id: config.LEMONSQUEEZY_STORE_ID } },
        variant: { data: { type: 'variants', id: params.variantId } },
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${config.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach Lemon Squeezy: ${detail}`);
  }

  if (!response.ok) {
    return fail('api_error', `Lemon Squeezy returned ${response.status}.`);
  }

  const parsed = checkoutResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return fail(
      'invalid_response',
      'Lemon Squeezy checkout response was not in the expected shape.',
    );
  }

  return ok({ url: parsed.data.data.attributes.url });
}
