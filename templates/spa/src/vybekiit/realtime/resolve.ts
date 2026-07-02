import { parseEnv, realtimeConfigSchema, type EnvSource } from '@vybekiit/core';
import { createLocalRealtime } from './providers/local';
import type { RealtimeProvider } from './types';

export function resolveRealtimeProvider(env: EnvSource = process.env): RealtimeProvider {
  parseEnv(realtimeConfigSchema, env);
  return createLocalRealtime();
}
