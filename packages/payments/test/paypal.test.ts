import { mapPayPalEvent } from '@vybekiit/payments/providers/paypal/webhook';
import { describe, expect, it } from 'vitest';

describe('mapPayPalEvent', () => {
  it('reads github username from a purchase unit on an order event', () => {
    const result = mapPayPalEvent({
      event_type: 'CHECKOUT.ORDER.APPROVED',
      resource: {
        id: 'order_1',
        payer: { email_address: 'buyer@example.com' },
        purchase_units: [{ custom_id: 'octocat' }],
      },
    });
    expect(result.provider).toBe('paypal');
    expect(result.orderId).toBe('order_1');
    expect(result.customerEmail).toBe('buyer@example.com');
    expect(result.githubUsername).toBe('octocat');
    expect(result.isRefund).toBe(false);
  });

  it('reads github username from custom_id and flags refunds on a capture event', () => {
    const result = mapPayPalEvent({
      event_type: 'PAYMENT.CAPTURE.REFUNDED',
      resource: { id: 'capture_1', custom_id: 'octocat' },
    });
    expect(result.githubUsername).toBe('octocat');
    expect(result.isRefund).toBe(true);
  });
});
