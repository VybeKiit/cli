import { type Result, type StripeConfig, fail, ok } from '@vybekiit/core';
import Stripe from 'stripe';
import type { OrderEvent } from '../../types';

/**
 * Map a verified Stripe event to the normalized {@link OrderEvent} (pure — unit
 * tested without network or signatures).
 *
 * Stripe's `Event` is intentionally *not* a discriminated union — `data.object` is
 * the full resource union regardless of `type` — so each branch narrows the object
 * with an assertion, which is the pattern Stripe's own docs use. Only the two events
 * the gate cares about are handled; anything else is an explicit, ignorable failure.
 */
export function mapStripeEvent(event: Stripe.Event): Result<OrderEvent> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      return ok({
        provider: 'stripe',
        eventName: event.type,
        orderId: session.id,
        customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
        githubUsername: session.metadata?.github_username ?? null,
        isRefund: false,
      });
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.id;
      return ok({
        provider: 'stripe',
        eventName: event.type,
        orderId: paymentIntentId,
        customerEmail: charge.billing_details?.email ?? charge.receipt_email ?? null,
        githubUsername: charge.metadata?.github_username ?? null,
        isRefund: true,
      });
    }
    default:
      return fail('unhandled_event', `Stripe event "${event.type}" is not handled.`);
  }
}

/**
 * Verify a Stripe webhook signature and map it to an {@link OrderEvent}.
 *
 * `constructEvent` recomputes the HMAC over the *raw* body and throws on a forged
 * or stale signature; that throw is caught and returned as an expected boundary
 * failure for the route to translate into a 4xx.
 */
export function parseStripeWebhook(
  config: StripeConfig,
  rawBody: string,
  signature: string,
): Result<OrderEvent> {
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'bad signature';
    return fail('invalid_signature', `Stripe webhook verification failed: ${detail}`);
  }
  return mapStripeEvent(event);
}
