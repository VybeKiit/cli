import { parseEnv, realtimeConfigSchema, type EnvSource } from '@vybekiit/core';
import { createLocalRealtime } from './providers/local';
import type { RealtimeProvider } from './types';

const UNSHIPPED = new Set(['cloudflare-do']);

/**
 * Resolve realtime provider. Only the local adapter ships today (ADR-0012);
 * supabase/cloudflare-do env values are accepted but resolve to local until adapters land.
 */
export function resolveRealtimeProvider(env: EnvSource = process.env): RealtimeProvider {
  const { REALTIME_PROVIDER } = parseEnv(realtimeConfigSchema, env);
  if (UNSHIPPED.has(REALTIME_PROVIDER)) {
    throw new Error(`${REALTIME_PROVIDER} realtime adapter ships in a later step`);
  }
  return createLocalRealtime();
}
