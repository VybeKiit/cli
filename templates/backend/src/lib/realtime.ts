import type { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setRealtimeIo(io: Server): void {
  ioInstance = io;
}

export function getRealtimeIo(): Server | null {
  return ioInstance;
}

export function isSocketIoEnabled(): boolean {
  return process.env.REALTIME_PROVIDER === 'socket-io';
}
