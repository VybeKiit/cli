import { it } from '@effect/vitest';
import { resolveKvProvider, resolveKvService } from '@vybekiit/infra/kv/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveKvProvider', () => {
  it('falls back to local when cloudflare is unconfigured', () => {
    const kv = resolveKvProvider({ KV_PROVIDER: 'cloudflare' });
    expect(kv.name).toBe('local');
  });

  it('stores and reads local values', async () => {
    const kv = resolveKvProvider({ KV_PROVIDER: 'local' });
    await Effect.runPromise(kv.set('key', 'value'));
    expect(await Effect.runPromise(kv.get('key'))).toBe('value');
  });
});

describe('resolveKvService', () => {
  it.effect('fails loud for the unshipped upstash adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveKvService({ KV_PROVIDER: 'upstash' }));
      expect(error.code).toBe('KV_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('upstash');
    }),
  );
});
