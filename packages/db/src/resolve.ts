import {
  awsConfigSchema,
  dataConfigSchema,
  firebaseConfigSchema,
  isBackendUnconfigured,
  mongoConfigSchema,
  neonConfigSchema,
  parseEnv,
  railwayConfigSchema,
  r2ConfigSchema,
  resolveEnvProvider,
  storageConfigSchema,
  supabaseConfigSchema,
  type EnvSource,
} from '@vybekiit/core';
import { createAwsDataProvider } from './providers/aws/index';
import { createFirebaseDataProvider } from './providers/firebase/index';
import { createLocalDataProvider } from './providers/local/index';
import { createMongoDataProvider } from './providers/mongodb/index';
import { createNeonDataProvider } from './providers/neon/index';
import { createRailwayDataProvider } from './providers/railway/index';
import { createR2StorageProvider } from './providers/r2/index';
import { createS3StorageProvider } from './providers/s3/index';
import {
  createSupabaseDataProvider,
  createSupabaseStorageProvider,
} from './providers/supabase/index';
import type { DataProvider, StorageProvider } from './types';

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
  if (isBackendUnconfigured(env)) return createLocalDataProvider();

  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  return resolveEnvProvider(
    DATA_PROVIDER,
    {
      local: () => createLocalDataProvider(),
      mongodb: (source) => createMongoDataProvider(parseEnv(mongoConfigSchema, source)),
      aws: (source) => createAwsDataProvider(parseEnv(awsConfigSchema, source)),
      neon: (source) => createNeonDataProvider(parseEnv(neonConfigSchema, source)),
      railway: (source) => createRailwayDataProvider(parseEnv(railwayConfigSchema, source)),
      firebase: (source) => createFirebaseDataProvider(parseEnv(firebaseConfigSchema, source)),
      supabase: (source) => createSupabaseDataProvider(parseEnv(supabaseConfigSchema, source)),
    },
    env,
    'supabase',
  );
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
  return resolveEnvProvider(
    STORAGE_PROVIDER,
    {
      s3: (source) => createS3StorageProvider(parseEnv(awsConfigSchema, source)),
      r2: (source) => createR2StorageProvider(parseEnv(r2ConfigSchema, source)),
      supabase: (source) => createSupabaseStorageProvider(parseEnv(supabaseConfigSchema, source)),
    },
    env,
    'supabase',
  );
}
