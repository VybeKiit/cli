import {
  type RealtimeChannel,
  RealtimeError,
  type RealtimeHandler,
  type RealtimePayload,
  type RealtimeProvider,
} from '@vybekiit/realtime/types';
import { Effect } from 'effect';

const realtimeErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

/**
 * Return the channel handler set, creating it when the channel is first used.
 *
 * @param channels - Local channel registry keyed by channel name.
 * @param name - Channel name requested by the caller.
 * @returns The mutable handler set for the channel.
 * @example
 * const handlers = resolveChannelHandlers(channels, 'room');
 */
const resolveChannelHandlers = (
  channels: Map<string, Set<RealtimeHandler>>,
  name: string,
): Set<RealtimeHandler> => {
  const existing = channels.get(name);
  if (existing !== undefined) {
    return existing;
  }

  const created = new Set<RealtimeHandler>();
  channels.set(name, created);
  return created;
};

/**
 * Build the in-memory realtime adapter for tests and local development.
 *
 * @returns A realtime provider whose channels fan out payloads to local subscribers.
 * @example
 * const realtime = createLocalRealtime();
 */
export const createLocalRealtime = (): RealtimeProvider => {
  const channels = new Map<string, Set<RealtimeHandler>>();
  return {
    name: 'local',
    channel: (name: string): RealtimeChannel => {
      const handlers = resolveChannelHandlers(channels, name);
      return {
        subscribe: (handler: RealtimeHandler): void => {
          handlers.add(handler);
        },
        publish: (payload: RealtimePayload): Effect.Effect<void, RealtimeError> =>
          Effect.try({
            try: () => {
              for (const handler of handlers) {
                handler(payload);
              }
            },
            catch: (caught) =>
              new RealtimeError({
                code: 'REALTIME_PUBLISH_FAILED',
                message: realtimeErrorMessage(caught),
              }),
          }),
        unsubscribe: (): void => {
          handlers.clear();
        },
      };
    },
  };
};
