import {
  awsConfigSchema,
  dataConfigSchema,
  mongoConfigSchema,
  parseEnv,
  storageConfigSchema,
  supabaseConfigSchema,
} from '@vybekiit/core';
import { createAwsDataProvider } from './providers/aws';
import { createLocalDataProvider } from './providers/local';
import { createMongoDataProvider } from './providers/mongodb';
import { createS3StorageProvider } from './providers/s3';
import { createSupabaseDataProvider, createSupabaseStorageProvider } from './providers/supabase';
import type { DataProvider, StorageProvider } from './types';

/** A readable view of `process.env` that doesn't require `@types/node` here. */
type EnvSource = Record<string, string | undefined>;

/**
 * The one required key that signals each real data backend is being configured —
 * its presence is how we distinguish "the builder wired a backend" from "fresh
 * scaffold, nothing set." Each is the non-optional anchor of its adapter's schema:
 * Supabase's project URL, Mongo's connection string, AWS's region.
 */
const BACKEND_ANCHOR_KEYS = ['SUPABASE_URL', 'MONGODB_URI', 'AWS_REGION'] as const;

/**
 * True when the environment carries no data configuration at all — neither an
 * explicit `DATA_PROVIDER` nor any real backend's anchor key. This is the only case
 * the local fallback fills; a single anchor key (or an explicit provider) means the
 * builder intends a real backend, so we resolve it normally and let it fail loud if
 * its other keys are missing. Checked against raw env *before* {@link parseEnv},
 * because the schema defaults `DATA_PROVIDER` to `supabase` (which would otherwise
 * mask the empty case and demand Supabase keys).
 */
function isDataUnconfigured(env: EnvSource): boolean {
  if (env.DATA_PROVIDER) return false;
  return BACKEND_ANCHOR_KEYS.every((key) => !env[key]);
}

/**
 * Construct the configured data provider from the environment — the single call
 * site features use, so they never name a backend. The agent swaps backends by
 * changing one env value.
 *
 * Fallback rule (ADR-0008): when `DATA_PROVIDER` is unset **and** no real backend's
 * anchor key is present, return the zero-config in-memory {@link createLocalDataProvider}
 * so a freshly scaffolded app runs on the first `pnpm dev` with no secrets. An
 * explicit `DATA_PROVIDER` (including `supabase`) or any backend key resolves exactly
 * as before — the fallback only fills the truly-empty case.
 *
 * @throws if a configured adapter's required keys are missing (via {@link parseEnv}).
 */
export function resolveDataProvider(env: EnvSource = process.env): DataProvider {
  if (isDataUnconfigured(env)) return createLocalDataProvider();

  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  switch (DATA_PROVIDER) {
    case 'local':
      return createLocalDataProvider();
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
