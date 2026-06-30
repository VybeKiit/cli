import type { Server as HttpServer } from 'node:http';
import { Server, type ServerOptions } from 'socket.io';

export type AttachSocketIoOptions = {
  readonly corsOrigin?: string | string[] | boolean;
  readonly path?: string;
};

export function attachSocketIo(
  httpServer: HttpServer,
  options: AttachSocketIoOptions = {},
): Server {
  const path = options.path ?? '/socket.io';
  const io = new Server(httpServer, {
    path,
    cors: {
      origin: options.corsOrigin ?? true,
      credentials: true,
    },
  } satisfies Partial<ServerOptions>);

  io.on('connection', (socket) => {
    socket.on('join', (channel: string) => {
      socket.join(channel);
    });
    socket.on('leave', (channel: string) => {
      socket.leave(channel);
    });
    socket.on('publish', (data: { channel: string; payload: Record<string, unknown> }) => {
      io.to(data.channel).emit(`channel:${data.channel}`, data.payload);
    });
  });

  return io;
}
