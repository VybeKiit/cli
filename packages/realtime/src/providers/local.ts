import type { RealtimeChannel, RealtimeHandler, RealtimeProvider } from '../types';

export function createLocalRealtime(): RealtimeProvider {
  const channels = new Map<string, Set<RealtimeHandler>>();
  return {
    name: 'local',
    channel(name: string): RealtimeChannel {
      if (!channels.has(name)) channels.set(name, new Set());
      const handlers = channels.get(name) as Set<RealtimeHandler>;
      return {
        subscribe(handler: RealtimeHandler): void {
          handlers.add(handler);
        },
        async publish(payload: Record<string, unknown>): Promise<void> {
          for (const handler of handlers) handler(payload);
        },
        unsubscribe(): void {
          handlers.clear();
        },
      };
    },
  };
}
