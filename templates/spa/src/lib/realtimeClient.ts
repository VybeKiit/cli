import { resolveRealtimeProvider } from '@/vybekiit/realtime';

/** Live updates wire point for Socket.IO / other realtime adapters. */
export function getRealtime() {
  return resolveRealtimeProvider();
}
