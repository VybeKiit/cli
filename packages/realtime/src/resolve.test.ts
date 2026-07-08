import { it } from '@effect/vitest';
import { resolveRealtimeProvider, resolveRealtimeService } from '@vybekiit/realtime/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveRealtimeProvider', () => {
  it('defaults to the local provider', () => {
    const rt = resolveRealtimeProvider({});
    expect(rt.name).toBe('local');
  });

  it('creates local channels', async () => {
    const rt = resolveRealtimeProvider({ REALTIME_PROVIDER: 'local' });
    const ch = rt.channel('room');
    let received = false;
    ch.subscribe(() => {
      received = true;
    });
    await Effect.runPromise(ch.publish({ hello: 'world' }));
    expect(received).toBe(true);
  });
});

describe('resolveRealtimeService', () => {
  it.effect('fails loud for the unshipped Cloudflare Durable Object adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveRealtimeService({ REALTIME_PROVIDER: 'cloudflare-do' }),
      );
      expect(error.code).toBe('REALTIME_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('cloudflare-do');
    }),
  );

  it.effect('fails loud for the unshipped Supabase adapter', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveRealtimeService({ REALTIME_PROVIDER: 'supabase' }));
      expect(error.code).toBe('REALTIME_PROVIDER_UNSUPPORTED');
      expect(error.message).toContain('supabase');
    }),
  );
});
