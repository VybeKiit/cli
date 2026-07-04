import { mapStripeEvent } from '@vybekiit/payments/providers/stripe/webhook';
import type Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

/**
 * Minimal event fixtures cast to `Stripe.Event`: the mapper only touches a handful
 * of fields, and constructing a complete Stripe object by hand would test nothing
 * extra. Signature verification (`constructEvent`) is exercised against the live
 * API, not here.
 */
function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

describe('mapStripeEvent', () => {
  it('maps a completed checkout session to a paid order', () => {
    const result = mapStripeEvent(
      event('checkout.session.completed', {
        id: 'cs_test_1',
        customer_details: { email: 'buyer@example.com' },
        metadata: { github_username: 'octocat' },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.provider).toBe('stripe');
      expect(result.value.orderId).toBe('cs_test_1');
      expect(result.value.customerEmail).toBe('buyer@example.com');
      expect(result.value.githubUsername).toBe('octocat');
      expect(result.value.isRefund).toBe(false);
    }
  });

  it('maps a refunded charge to a revocation, keyed by payment intent', () => {
    const result = mapStripeEvent(
      event('charge.refunded', {
        id: 'ch_1',
        payment_intent: 'pi_1',
        metadata: { github_username: 'octocat' },
      }),
    );
    expect(result.ok && result.value.isRefund).toBe(true);
    expect(result.ok && result.value.orderId).toBe('pi_1');
  });

  it('ignores events the gate does not care about', () => {
    const result = mapStripeEvent(event('invoice.paid', { id: 'in_1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('unhandled_event');
  });
});
