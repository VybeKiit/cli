import { describe, expect, it } from 'vitest';
import { resolveProviderBrand, resolveProviderBrands } from './provider-mark';

describe('resolveProviderBrand', () => {
  it('resolves neon / stripe / lemon aliases', () => {
    expect(resolveProviderBrand('neon')?.id).toBe('neon');
    expect(resolveProviderBrand('stripe')?.id).toBe('stripe');
    expect(resolveProviderBrand('lemon')?.id).toBe('lemon-squeezy');
    expect(resolveProviderBrand('lemon squeezy')?.id).toBe('lemon-squeezy');
    expect(resolveProviderBrand('ls')?.id).toBe('lemon-squeezy');
  });

  it('resolves deploy + auth providers', () => {
    expect(resolveProviderBrand('cloudflare')?.id).toBe('cloudflare');
    expect(resolveProviderBrand('vercel')?.id).toBe('vercel');
    expect(resolveProviderBrand('railway')?.id).toBe('railway');
    expect(resolveProviderBrand('google')?.id).toBe('google');
  });

  it('falls back by domain and resource (kit defaults)', () => {
    expect(resolveProviderBrand(undefined, 'payments')?.id).toBe('lemon-squeezy');
    expect(resolveProviderBrand(undefined, 'database')?.id).toBe('neon');
    expect(resolveProviderBrand(undefined, 'deploy')?.id).toBe('cloudflare');
    // Orders commerce resource → Lemon Squeezy logo
    expect(resolveProviderBrand(undefined, 'crud', 'orders')?.id).toBe('lemon-squeezy');
    expect(resolveProviderBrand('orders')?.id).toBe('lemon-squeezy');
  });

  it('dedupes multi-action brand stacks', () => {
    const brands = resolveProviderBrands(['neon', 'stripe', 'cloudflare', 'neon']);
    expect(brands.map((b) => b.id)).toEqual(['neon', 'stripe', 'cloudflare']);
    expect(resolveProviderBrands(['payments', 'orders']).map((b) => b.id)).toEqual([
      'lemon-squeezy',
    ]);
  });

  it('covers production Live work brand matrix', () => {
    const matrix: ReadonlyArray<{
      readonly provider?: string;
      readonly domain?: 'auth' | 'database' | 'payments' | 'deploy' | 'crud';
      readonly resource?: string;
      readonly id: string;
    }> = [
      { provider: 'neon', id: 'neon' },
      { provider: 'supabase', id: 'supabase' },
      { provider: 'google', id: 'google' },
      { provider: 'stripe', id: 'stripe' },
      { provider: 'lemon squeezy', id: 'lemon-squeezy' },
      { provider: 'ls', id: 'lemon-squeezy' },
      { resource: 'orders', domain: 'crud', id: 'lemon-squeezy' },
      { provider: 'cloudflare', id: 'cloudflare' },
      { provider: 'vercel', id: 'vercel' },
      { provider: 'render', id: 'render' },
      { provider: 'railway', id: 'railway' },
      { domain: 'payments', id: 'lemon-squeezy' },
      { domain: 'database', id: 'neon' },
      { domain: 'deploy', id: 'cloudflare' },
      { domain: 'auth', id: 'google' },
    ];
    for (const row of matrix) {
      expect(
        resolveProviderBrand(row.provider, row.domain, row.resource)?.id,
        JSON.stringify(row),
      ).toBe(row.id);
    }
  });
});
