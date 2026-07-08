import { resolveRealtimeProvider } from '@vybekiit/realtime';

/**
 * Resolve the live updates provider for the SPA template.
 *
 * @returns The configured realtime provider.
 * @example
 * const realtime = getRealtime();
 */
export const getRealtime = () => resolveRealtimeProvider();
