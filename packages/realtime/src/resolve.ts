import { parseEnv, realtimeConfigSchema, type EnvSource } from '@vybekiit/core';
import { createLocalRealtime } from './providers/local';
import type { RealtimeProvider } from './types';

function isSupabaseUnconfigured(env: EnvSource): boolean {
  return !(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export function resolveRealtimeProvider(env: EnvSource = process.env): RealtimeProvider {
  const { REALTIME_PROVIDER } = parseEnv(realtimeConfigSchema, env);
  if (REALTIME_PROVIDER === 'cloudflare-do') {
    throw new Error('cloudflare-do realtime adapter ships in a later step');
  }
  if (REALTIME_PROVIDER === 'supabase' && !isSupabaseUnconfigured(env)) {
    return createLocalRealtime();
  }
  return createLocalRealtime();
}
