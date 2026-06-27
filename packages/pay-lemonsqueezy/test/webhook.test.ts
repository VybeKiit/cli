import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseWebhook, verifyWebhookSignature } from '../src/webhook';

const SECRET = 'test-secret';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

const orderCreated = JSON.stringify({
  meta: { event_name: 'order_created', custom_data: { github_username: 'octocat' } },
  data: { id: 'order_1', attributes: { user_email: 'buyer@example.com' } },
});

describe('verifyWebhookSignature', () => {
  it('accepts a correct signature', () => {
    expect(verifyWebhookSignature(orderCreated, sign(orderCreated), SECRET)).toBe(true);
  });

  it('rejects a forged signature', () => {
    expect(verifyWebhookSignature(orderCreated, sign('tampered'), SECRET)).toBe(false);
  });
});

describe('parseWebhook', () => {
  it('normalizes a verified order_created event', () => {
    const result = parseWebhook(orderCreated, sign(orderCreated), SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.githubUsername).toBe('octocat');
      expect(result.value.customerEmail).toBe('buyer@example.com');
      expect(result.value.isRefund).toBe(false);
    }
  });

  it('flags refunds for revocation', () => {
    const refund = JSON.stringify({
      meta: { event_name: 'order_refunded', custom_data: { github_username: 'octocat' } },
      data: { id: 'order_1', attributes: { refunded: true } },
    });
    const result = parseWebhook(refund, sign(refund), SECRET);
    expect(result.ok && result.value.isRefund).toBe(true);
  });

  it('fails closed on a bad signature', () => {
    const result = parseWebhook(orderCreated, 'deadbeef', SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_signature');
  });
});
