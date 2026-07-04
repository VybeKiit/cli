import { fail, ok, type Result, type StripeConfig } from '@vybekiit/core';
import type { CheckoutParams, CheckoutResult } from '@vybekiit/payments/types';
import Stripe from 'stripe';

/**
 * Create a Stripe Checkout Session and return its hosted URL.
 *
 * `productId` is a Stripe **price** id (`price_…`). `githubUsername` rides along in
 * session `metadata` so the `checkout.session.completed` webhook can read it back
 * for the gate. Stripe requires a `success_url`; the buyer's app passes its origin.
 */
export async function createStripeCheckout(
  config: StripeConfig,
  params: CheckoutParams,
): Promise<Result<CheckoutResult>> {
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  let url: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: params.productId, quantity: 1 }],
      success_url: params.successUrl ?? '',
      cancel_url: params.cancelUrl ?? params.successUrl ?? '',
      ...(params.email ? { customer_email: params.email } : {}),
      ...(params.githubUsername ? { metadata: { github_username: params.githubUsername } } : {}),
    });
    url = session.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    return fail('api_error', `Stripe could not create a checkout: ${detail}`);
  }

  if (!url) {
    return fail('invalid_response', 'Stripe did not return a checkout URL.');
  }
  return ok({ url });
}
