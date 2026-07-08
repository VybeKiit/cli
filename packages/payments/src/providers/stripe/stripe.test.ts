import { mapStripeEvent } from '@vybekiit/payments/providers/stripe/webhook';
import { Effect } from 'effect';
import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

/**
 * Minimal event fixtures cast to `Stripe.Event`: the mapper only touches a handful
 * of fields, and constructing a complete Stripe object by hand would test nothing
 * extra. Signature verification (`constructEvent`) is exercised against the live
 * API, not here.
 *
 * @param type - Stripe event type to place on the fixture.
 * @param object - Minimal Stripe event data object used by the mapper.
 * @returns A Stripe event fixture for mapper tests.
 * @example
 * const fixture = event('checkout.session.completed', { id: 'cs_test_1' });
 */
const event = (type: string, object: Record<string, unknown>): Stripe.Event =>
  ({ type, data: { object } }) as unknown as Stripe.Event;

describe('mapStripeEvent', () => {
  it('maps a completed checkout session to a paid order', async () => {
    const result = await Effect.runPromise(
      mapStripeEvent(
        event('checkout.session.completed', {
          id: 'cs_test_1',
          customer_details: { email: 'buyer@example.com' },
          metadata: { github_username: 'octocat' },
        }),
      ),
    );

    expect(result.provider).toBe('stripe');
    expect(result.orderId).toBe('cs_test_1');
    expect(result.customerEmail).toBe('buyer@example.com');
    expect(result.githubUsername).toBe('octocat');
    expect(result.isRefund).toBe(false);
  });

  it('maps a refunded charge to a revocation, keyed by payment intent', async () => {
    const result = await Effect.runPromise(
      mapStripeEvent(
        event('charge.refunded', {
          id: 'ch_1',
          payment_intent: 'pi_1',
          metadata: { github_username: 'octocat' },
        }),
      ),
    );

    expect(result.isRefund).toBe(true);
    expect(result.orderId).toBe('pi_1');
  });

  it('ignores events the gate does not care about', async () => {
    const error = await Effect.runPromise(
      Effect.flip(mapStripeEvent(event('invoice.paid', { id: 'in_1' }))),
    );

    expect(error.code).toBe('unhandled_event');
  });
});
