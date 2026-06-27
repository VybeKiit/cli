import {
  dataConfigSchema,
  parseEnv,
  storageConfigSchema,
  supabaseConfigSchema,
} from '@vybekiit/core';
import { createSupabaseDataProvider, createSupabaseStorageProvider } from './providers/supabase';
import type { DataProvider, StorageProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * Construct the configured data provider from the environment — the single call
 * site features use, so they never name a backend. Reads `DATA_PROVIDER` (defaults
 * to `supabase`) and parses only that adapter's credentials. The agent swaps
 * backends by changing one env value.
 *
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}),
 *   or, for `mongodb`/`aws`, a not-implemented error until those adapters ship.
 */
export function resolveDataProvider(env: EnvSource = process.env): DataProvider {
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  switch (DATA_PROVIDER) {
    case 'mongodb':
      throw new Error('mongodb data adapter ships in a later step'); // TODO(step-4)
    case 'aws':
      throw new Error('aws data adapter ships in a later step'); // TODO(step-4)
    default:
      return createSupabaseDataProvider(parseEnv(supabaseConfigSchema, env));
  }
}

/**
 * Construct the configured storage provider from the environment. Reads
 * `STORAGE_PROVIDER` (defaults to `supabase`); the `s3` adapter ships later.
 *
 * @throws if the chosen adapter's required keys are missing, or a not-implemented
 *   error for `s3` until that adapter ships.
 */
export function resolveStorageProvider(env: EnvSource = process.env): StorageProvider {
  const { STORAGE_PROVIDER } = parseEnv(storageConfigSchema, env);
  switch (STORAGE_PROVIDER) {
    case 's3':
      throw new Error('s3 storage adapter ships in a later step'); // TODO(step-5)
    default:
      return createSupabaseStorageProvider(parseEnv(supabaseConfigSchema, env));
  }
}
