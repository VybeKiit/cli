import process from 'node:process';
import { type EnvSource, parseEnv, realtimeConfigSchema } from '@vybekiit/core';
import { createLocalRealtime } from './providers/local';
import type { RealtimeProvider } from './types';

export function resolveRealtimeProvider(env: EnvSource = process.env): RealtimeProvider {
  parseEnv(realtimeConfigSchema, env);
  return createLocalRealtime();
}
