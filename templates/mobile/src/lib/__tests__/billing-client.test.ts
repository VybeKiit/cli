import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startCheckout } from '../billing-client';

describe('startCheckout', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('rejects an empty plan id with invalid_input', async () => {
    const result = await startCheckout('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
  });

  it('posts the plan id to /api/checkout and returns the checkout url', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ url: 'http://localhost:3000/checkout/practice?productId=plan_pro' }),
    } as Response);

    const result = await startCheckout('plan_pro');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.url).toContain('checkout/practice');
  });
});
