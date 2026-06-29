import { describe, expect, it } from 'vitest';
import { resolveRealtimeProvider } from '../src/resolve';

describe('resolveRealtimeProvider', () => {
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
