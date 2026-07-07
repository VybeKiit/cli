// biome-ignore-all lint/style/noExcessiveClassesPerFile: Effect service tags are intentionally colocated with resolver layers.
import {
  awsConfigSchema,
  dataConfigSchema,
  type EnvSource,
  firebaseConfigSchema,
  isBackendUnconfigured,
  mongoConfigSchema,
  neonConfigSchema,
  parseEnv,
  r2ConfigSchema,
  railwayConfigSchema,
  resolveEnvProvider,
  storageConfigSchema,
  supabaseConfigSchema,
} from '@vybekiit/core';
import { Context, Effect, Layer } from 'effect';
import { createAwsDataProvider } from './providers/aws';
import { createFirebaseDataProvider } from './providers/firebase';
import { createLocalDataProvider } from './providers/local';
import { createMongoDataProvider } from './providers/mongodb';
import { createNeonDataProvider } from './providers/neon';
import { createR2StorageProvider } from './providers/r2';
import { createRailwayDataProvider } from './providers/railway';
import { createS3StorageProvider } from './providers/s3';
import { createSupabaseDataProvider, createSupabaseStorageProvider } from './providers/supabase';
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
 * @param env - Raw environment source to decode.
 * @returns The configured data provider.
 * @throws if a configured adapter's required keys are missing (via {@link parseEnv}).
 * @example
 * const provider = resolveDataProvider(process.env);
 */
export const resolveDataProvider = (env: EnvSource = process.env): DataProvider => {
  if (isBackendUnconfigured(env)) {
    return createLocalDataProvider();
  }

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
};

/**
 * Construct the configured storage provider from the environment. Reads
 * `STORAGE_PROVIDER` (defaults to `supabase`); `s3` reuses the same AWS region +
 * credentials as the DynamoDB data adapter.
 *
 * @param env - Raw environment source to decode.
 * @returns The configured storage provider.
 * @throws if the chosen adapter's required keys are missing (via {@link parseEnv}).
 * @example
 * const provider = resolveStorageProvider(process.env);
 */
export const resolveStorageProvider = (env: EnvSource = process.env): StorageProvider => {
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
};

/** The data provider as an injectable service — composition roots `Effect.provide` it (ADR-0023 DI). */
export class Data extends Context.Tag('@vybekiit/db/Data')<Data, DataProvider>() {}

/**
 * Build the live Data service layer from an environment source.
 *
 * @param env - Raw environment source to decode.
 * @returns A Layer that provides {@link Data}.
 * @example
 * const layer = makeDataLive(process.env);
 */
export const makeDataLive = (env: EnvSource = process.env): Layer.Layer<Data> =>
  Layer.effect(
    Data,
    Effect.sync(() => resolveDataProvider(env)),
  );

/** The storage provider as an injectable service (ADR-0023 DI). */
export class Storage extends Context.Tag('@vybekiit/db/Storage')<Storage, StorageProvider>() {}

/**
 * Build the live Storage service layer from an environment source.
 *
 * @param env - Raw environment source to decode.
 * @returns A Layer that provides {@link Storage}.
 * @example
 * const layer = makeStorageLive(process.env);
 */
export const makeStorageLive = (env: EnvSource = process.env): Layer.Layer<Storage> =>
  Layer.effect(
    Storage,
    Effect.sync(() => resolveStorageProvider(env)),
  );
