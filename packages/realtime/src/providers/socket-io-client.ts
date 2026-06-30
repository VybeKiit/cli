import { io, type Socket } from 'socket.io-client';

import type { RealtimeChannel, RealtimeHandler, RealtimeProvider } from '../types';

export type SocketIoClientOptions = {
  readonly url: string;
  readonly path?: string;
};

type SocketFactory = (url: string, opts: { path: string }) => Socket;

const defaultSocketFactory: SocketFactory = (url, opts) => io(url, { path: opts.path });

export function createSocketIoRealtime(
  options: SocketIoClientOptions,
  socketFactory: SocketFactory = defaultSocketFactory,
): RealtimeProvider {
  const path = options.path ?? '/socket.io';
  let socket: Socket | null = null;

  function getSocket(): Socket {
    if (!socket) {
      socket = socketFactory(options.url, { path });
    }
    return socket;
  }

  return {
    name: 'socket-io',
    channel(name: string): RealtimeChannel {
      const eventName = `channel:${name}`;
      const sock = getSocket();
      sock.emit('join', name);

      return {
        subscribe(handler: RealtimeHandler): void {
          sock.on(eventName, handler);
        },
        async publish(payload: Record<string, unknown>): Promise<void> {
          sock.emit('publish', { channel: name, payload });
        },
        unsubscribe(): void {
          sock.off(eventName);
          sock.emit('leave', name);
        },
      };
    },
  };
}
