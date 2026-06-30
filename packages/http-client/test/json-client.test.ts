import { describe, expect, it, vi } from 'vitest';
import { createJsonClient } from '../src/index';

describe('createJsonClient', () => {
  it('returns ok on 2xx JSON', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: '1' }),
    })) as unknown as typeof globalThis.fetch;

    const client = createJsonClient({ fetch });
    const result = await client.getJson<{ id: string }>('/api/test');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('1');
  });

  it('returns http_error on non-2xx', async () => {
    const fetch = vi.fn(async () => ({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Invalid' }),
    })) as unknown as typeof globalThis.fetch;

    const result = await createJsonClient({ fetch }).postJson('/api/x', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('http_error');
      expect(result.error.message).toBe('Invalid');
    }
  });

  it('returns network_error when fetch throws', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof globalThis.fetch;

    const result = await createJsonClient({ fetch }).getJson('/api/x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('network_error');
  });

  it('resolves relative URLs at the seam', async () => {
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ url }),
    })) as unknown as typeof globalThis.fetch;

    const client = createJsonClient({
      resolveUrl: (url) => `https://app.test${url}`,
      fetch,
    });
    await client.getJson('/api/ping');
    expect(fetch).toHaveBeenCalledWith('https://app.test/api/ping', expect.any(Object));
  });
});
