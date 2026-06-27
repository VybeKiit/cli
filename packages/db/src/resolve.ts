import {
  awsConfigSchema,
  dataConfigSchema,
  mongoConfigSchema,
  parseEnv,
  storageConfigSchema,
  supabaseConfigSchema,
} from '@vybekiit/core';
import { createAwsDataProvider } from './providers/aws';
import { createMongoDataProvider } from './providers/mongodb';
import { createS3StorageProvider } from './providers/s3';
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
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}).
 */
export function resolveDataProvider(env: EnvSource = process.env): DataProvider {
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  switch (DATA_PROVIDER) {
    case 'mongodb':
      return createMongoDataProvider(parseEnv(mongoConfigSchema, env));
    case 'aws':
      return createAwsDataProvider(parseEnv(awsConfigSchema, env));
    default:
      return createSupabaseDataProvider(parseEnv(supabaseConfigSchema, env));
  }
}

/**
 * Construct the configured storage provider from the environment. Reads
 * `STORAGE_PROVIDER` (defaults to `supabase`); `s3` reuses the same AWS region +
 * credentials as the DynamoDB data adapter.
 *
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}).
 */
export function resolveStorageProvider(env: EnvSource = process.env): StorageProvider {
  const { STORAGE_PROVIDER } = parseEnv(storageConfigSchema, env);
  switch (STORAGE_PROVIDER) {
    case 's3':
      return createS3StorageProvider(parseEnv(awsConfigSchema, env));
    default:
      return createSupabaseStorageProvider(parseEnv(supabaseConfigSchema, env));
  }
}
