import { resolveRealtimeProvider } from '@vybekiit/realtime';

/** Live updates wire point */
export function getRealtime() {
  return resolveRealtimeProvider();
}
