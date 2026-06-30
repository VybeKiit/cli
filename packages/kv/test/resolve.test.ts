import { describe, expect, it } from 'vitest';
import { resolveKvProvider } from '../src/resolve';

describe('resolveKvProvider', () => {
  it('falls back to local when cloudflare is unconfigured', () => {
    const kv = resolveKvProvider({ KV_PROVIDER: 'cloudflare' });
    expect(kv.name).toBe('local');
  });

  it('falls back to local for unshipped upstash provider', () => {
    const kv = resolveKvProvider({ KV_PROVIDER: 'upstash' });
    expect(kv.name).toBe('local');
  });

  it('stores and reads local values', async () => {
    const kv = resolveKvProvider({ KV_PROVIDER: 'local' });
    await kv.set('key', 'value');
    expect(await kv.get('key')).toBe('value');
  });
});
