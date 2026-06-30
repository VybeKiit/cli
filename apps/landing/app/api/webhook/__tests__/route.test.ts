import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from '../route';

vi.mock('@vybekiit/payments', () => ({
  resolvePaymentProvider: vi.fn(),
}));

vi.mock('@vybekiit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vybekiit/core')>();
  return {
    ...actual,
    parseEnv: vi.fn(() => ({
      GITHUB_GATE_TOKEN: 'tok',
      GITHUB_GATE_ORG: 'VybeKiit',
      GITHUB_GATE_REPOS: ['web', 'spa', 'mobile', 'extension'],
    })),
  };
});

import { resolvePaymentProvider } from '@vybekiit/payments';

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));
  });

  it('invites buyer to all mirrors on paid order', async () => {
    vi.mocked(resolvePaymentProvider).mockReturnValue({
      name: 'lemon-squeezy',
      createCheckout: vi.fn(),
      parseWebhook: vi.fn().mockResolvedValue({
        ok: true,
        value: {
          provider: 'lemon-squeezy',
          eventName: 'order_created',
          orderId: '1',
          customerEmail: 'a@b.com',
          githubUsername: 'buyer',
          isRefund: false,
        },
      }),
    });

    const req = new Request('http://localhost/api/webhook', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
