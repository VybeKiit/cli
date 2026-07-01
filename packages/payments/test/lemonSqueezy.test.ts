import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  parseLemonSqueezyWebhook,
  verifyLemonSqueezySignature,
} from '../src/providers/lemonSqueezy/webhook';

const SECRET = 'test-secret';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

const orderCreated = JSON.stringify({
  meta: { event_name: 'order_created', custom_data: { github_username: 'octocat' } },
  data: { id: 'order_1', attributes: { user_email: 'buyer@example.com' } },
});

describe('verifyLemonSqueezySignature', () => {
  it('accepts a correct signature', () => {
    expect(verifyLemonSqueezySignature(orderCreated, sign(orderCreated), SECRET)).toBe(true);
  });

  it('rejects a forged signature', () => {
    expect(verifyLemonSqueezySignature(orderCreated, sign('tampered'), SECRET)).toBe(false);
  });
});

describe('parseLemonSqueezyWebhook', () => {
  it('normalizes a verified order_created event', () => {
    const result = parseLemonSqueezyWebhook(orderCreated, sign(orderCreated), SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.provider).toBe('lemon-squeezy');
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
    const result = parseLemonSqueezyWebhook(refund, sign(refund), SECRET);
    expect(result.ok && result.value.isRefund).toBe(true);
  });

  it('fails closed on a bad signature', () => {
    const result = parseLemonSqueezyWebhook(orderCreated, 'deadbeef', SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_signature');
  });
});
