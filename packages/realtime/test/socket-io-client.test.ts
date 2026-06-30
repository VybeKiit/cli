import { describe, expect, it } from 'vitest';
import { createSocketIoRealtime } from '../src/providers/socket-io-client';
import type { RealtimeHandler } from '../src/types';

describe('createSocketIoRealtime', () => {
  it('joins channel and publishes via socket events', async () => {
    const handlers = new Map<string, Set<RealtimeHandler>>();
    const emitted: { event: string; data: unknown }[] = [];
    const mockSocket = {
      emit(event: string, data?: unknown) {
        emitted.push({ event, data });
      },
      on(event: string, handler: RealtimeHandler) {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)?.add(handler);
      },
      off(event: string) {
        handlers.delete(event);
      },
    };
    const rt = createSocketIoRealtime(
      { url: 'http://localhost:4000' },
      () => mockSocket as never,
    );
    const ch = rt.channel('notifications');
    ch.subscribe(() => {});
    expect(emitted).toContainEqual({ event: 'join', data: 'notifications' });
    await ch.publish({ count: 1 });
    ch.unsubscribe();
    expect(emitted.some((e) => e.event === 'leave')).toBe(true);
  });
});
