import { describe, expect, it } from 'vitest';
import { resolveRealtimeProvider } from '../resolve';

describe('resolveRealtimeProvider', () => {
  it('falls back to local for unshipped cloudflare-do provider', () => {
    const rt = resolveRealtimeProvider({ REALTIME_PROVIDER: 'cloudflare-do' });
    expect(rt.name).toBe('local');
  });

  it('creates local channels', async () => {
    const rt = resolveRealtimeProvider({ REALTIME_PROVIDER: 'local' });
    const ch = rt.channel('room');
    let received = false;
    ch.subscribe(() => {
      received = true;
    });
    await ch.publish({ hello: 'world' });
    expect(received).toBe(true);
  });
});
