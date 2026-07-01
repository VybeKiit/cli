import { describe, expect, it, vi } from 'vitest';
import { badInput, created, forbidden, ok, unauthorized, upstreamFailed } from '../src/builders';
import { HTTP_OUTCOMES } from '../src/outcomes';
import { createJsonClient } from '../src/client';

describe('HTTP outcome builders', () => {
  it('maps each builder to status + { code, error } body', () => {
    expect(badInput('Missing field')).toEqual({
      status: 400,
      body: { code: 'bad_input', error: 'Missing field' },
    });
    expect(unauthorized('Sign in first')).toEqual({
      status: 401,
      body: { code: 'unauthorized', error: 'Sign in first' },
    });
    expect(forbidden('Blocked')).toEqual({
      status: 403,
      body: { code: 'forbidden', error: 'Blocked' },
    });
    expect(upstreamFailed('Provider down')).toEqual({
      status: 502,
      body: { code: 'upstream_failed', error: 'Provider down' },
    });
  });

  it('returns success payloads without code', () => {
    expect(ok({ id: '1' })).toEqual({ status: 200, body: { id: '1' } });
    expect(created({ id: '1' })).toEqual({ status: 201, body: { id: '1' } });
  });

  it('covers the full HTTP outcome catalog', () => {
    expect(Object.keys(HTTP_OUTCOMES)).toHaveLength(10);
  });
});

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

  it('preserves semantic code on non-2xx', async () => {
    const fetch = vi.fn(async () => ({
      ok: false,
      status: 422,
      json: async () => ({ code: 'validation_error', error: 'Invalid' }),
    })) as unknown as typeof globalThis.fetch;

    const result = await createJsonClient({ fetch }).postJson('/api/x', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_error');
      expect(result.error.message).toBe('Invalid');
    }
  });

  it('derives code from status when body omits code', async () => {
    const fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not signed in.' }),
    })) as unknown as typeof globalThis.fetch;

    const result = await createJsonClient({ fetch }).getJson('/api/me');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('unauthorized');
      expect(result.error.message).toBe('Not signed in.');
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
