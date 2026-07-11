import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetMemoryPriceLadderForTests } from '@/lib/priceLadderStore';
import { POST } from '../route';

vi.mock('@vybekiit/payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vybekiit/payments')>();
  return {
    ...actual,
    resolvePaymentProvider: vi.fn(),
  };
});

vi.mock('@vybekiit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vybekiit/core')>();
  return {
    ...actual,
    parseEnv: vi.fn(() => ({
      GITHUB_GATE_TOKEN: 'tok',
      GITHUB_GATE_ORG: 'VybeKiit',
      GITHUB_GATE_REPOS: ['kit', 'web', 'mobile', 'extension'],
    })),
  };
});

vi.mock('@/lib/orders', () => ({
  recordOrderBestEffort: vi.fn().mockResolvedValue(false),
}));

import { resolvePaymentProvider } from '@vybekiit/payments';

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryPriceLadderForTests();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));
  });

  it('invites buyer to all mirrors on paid order and bumps the price ladder', async () => {
    vi.mocked(resolvePaymentProvider).mockReturnValue({
      name: 'lemon-squeezy',
      createCheckout: vi.fn(),
      parseWebhook: vi.fn().mockReturnValue(
        Effect.succeed({
          provider: 'lemon-squeezy',
          eventName: 'order_created',
          orderId: '1',
          customerEmail: 'a@b.com',
          customerName: 'Ada',
          githubUsername: 'buyer',
          isRefund: false,
        }),
      ),
    });

    const req = new Request('http://localhost/api/webhook', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(4);
    const body = (await res.json()) as {
      ladderBumped: boolean;
      ladder: { amount: number; saleCount: number } | null;
    };
    expect(body.ladderBumped).toBe(true);
    expect(body.ladder?.saleCount).toBe(1);
    expect(body.ladder?.amount).toBe(32);
  });

  it('does not lower the ladder on refund', async () => {
    vi.mocked(resolvePaymentProvider).mockReturnValue({
      name: 'lemon-squeezy',
      createCheckout: vi.fn(),
      parseWebhook: vi.fn().mockReturnValue(
        Effect.succeed({
          provider: 'lemon-squeezy',
          eventName: 'order_refunded',
          orderId: 'refund-1',
          customerEmail: 'a@b.com',
          customerName: 'Ada',
          githubUsername: 'buyer',
          isRefund: true,
        }),
      ),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204 }));

    const res = await POST(
      new Request('http://localhost/api/webhook', { method: 'POST', body: '{}' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ladderBumped: boolean; ladder: null };
    expect(body.ladderBumped).toBe(false);
    expect(body.ladder).toBeNull();
  });
});
