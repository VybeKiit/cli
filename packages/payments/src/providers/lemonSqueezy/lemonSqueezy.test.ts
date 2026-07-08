import { createHmac } from 'node:crypto';
import {
  parseLemonSqueezyWebhook,
  verifyLemonSqueezySignature,
} from '@vybekiit/payments/providers/lemonSqueezy/webhook';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

const SECRET = 'test-secret';

/**
 * Sign a test webhook body with the Lemon Squeezy test secret.
 *
 * @param body - Raw webhook body to sign.
 * @returns Hex HMAC signature for the body.
 * @example
 * const signature = sign(orderCreated);
 */
const sign = (body: string): string => createHmac('sha256', SECRET).update(body).digest('hex');

const orderCreated = JSON.stringify({
  meta: { event_name: 'order_created', custom_data: { github_username: 'octocat' } },
  data: {
    id: 'order_1',
    attributes: { user_email: 'buyer@example.com', user_name: 'Ada Lovelace' },
  },
});

describe('verifyLemonSqueezySignature', () => {
  it('accepts a correct signature', () => {
    expect(verifyLemonSqueezySignature(orderCreated, sign(orderCreated), SECRET)).toBe(true);
  });

  it('rejects a forged signature', () => {
    expect(verifyLemonSqueezySignature(orderCreated, sign('tampered'), SECRET)).toBe(false);
  });
});

describe('lemon webhook parser', () => {
  it('normalizes a verified order_created event', async () => {
    const result = await Effect.runPromise(
      parseLemonSqueezyWebhook(orderCreated, sign(orderCreated), SECRET),
    );

    expect(result.provider).toBe('lemon-squeezy');
    expect(result.githubUsername).toBe('octocat');
    expect(result.customerEmail).toBe('buyer@example.com');
    expect(result.customerName).toBe('Ada Lovelace');
    expect(result.isRefund).toBe(false);
  });

  it('flags refunds for revocation', async () => {
    const refund = JSON.stringify({
      meta: { event_name: 'order_refunded', custom_data: { github_username: 'octocat' } },
      data: { id: 'order_1', attributes: { refunded: true } },
    });
    const result = await Effect.runPromise(parseLemonSqueezyWebhook(refund, sign(refund), SECRET));

    expect(result.isRefund).toBe(true);
  });

  it('fails closed on a bad signature', async () => {
    const error = await Effect.runPromise(
      Effect.flip(parseLemonSqueezyWebhook(orderCreated, 'deadbeef', SECRET)),
    );

    expect(error.code).toBe('invalid_signature');
  });
});
