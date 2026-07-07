import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  AssetAppConfigSchema,
  type AssetAppConfigType,
  AssetAwsConfigSchema,
  AssetCloudflareConfigSchema,
  AssetHostingConfigSchema,
  type AssetHostingProviderType,
  AssetR2ConfigSchema,
  AssetStorageConfigSchema,
  type AssetStorageProviderType,
  AssetSupabaseConfigSchema,
} from './config';
import {
  createAwsS3Delivery,
  createCloudflareR2Delivery,
  createCloudflareSupabaseDelivery,
  createLocalAssetDelivery,
  createVercelDelivery,
} from './providers';
import {
  type AssetDeliveryProvider,
  type AssetDeliveryService,
  AssetError,
  type AssetUrlOptionsType,
  type OptimizeBuildOptionsType,
  type OptimizeBuildResultType,
} from './types';

/** Injectable asset delivery service tag used by composition roots and tests. */
export class AssetDelivery extends Context.Tag('@vybekiit/assets/AssetDelivery')<
  AssetDelivery,
  AssetDeliveryService
>() {}

type AssetProviderFactory = (
  source: EnvSource,
  app: AssetAppConfigType,
) => Effect.Effect<AssetDeliveryProvider, AssetError>;

type CloudflareStorageFactory = (
  source: EnvSource,
  app: AssetAppConfigType,
) => Effect.Effect<AssetDeliveryProvider, AssetError>;

const assetProviderFactories = {
  local: () => Effect.succeed(createLocalAssetDelivery()),
  railway: () => Effect.succeed(createLocalAssetDelivery()),
  vercel: (_source, app) => Effect.succeed(createVercelDelivery({ app })),
  aws: (source, app) =>
    parseAssetConfigSlice(AssetAwsConfigSchema, source).pipe(
      Effect.map((aws) => createAwsS3Delivery({ aws, app })),
    ),
  cloudflare: (source, app) => resolveCloudflareStackDelivery(source, app),
} satisfies Partial<Record<AssetHostingProviderType, AssetProviderFactory>>;

const cloudflareStorageFactories = {
  r2: (source, app) =>
    Effect.all({
      cloudflare: parseAssetConfigSlice(AssetCloudflareConfigSchema, source),
      r2: parseAssetConfigSlice(AssetR2ConfigSchema, source),
    }).pipe(
      Effect.map(({ cloudflare, r2 }) => createCloudflareR2Delivery({ cloudflare, r2, app })),
    ),
  supabase: (source, app) =>
    Effect.all({
      cloudflare: parseAssetConfigSlice(AssetCloudflareConfigSchema, source),
      supabase: parseAssetConfigSlice(AssetSupabaseConfigSchema, source),
    }).pipe(
      Effect.map(({ cloudflare, supabase }) =>
        createCloudflareSupabaseDelivery({ cloudflare, supabase, app }),
      ),
    ),
  s3: (source, app) =>
    parseAssetConfigSlice(AssetAwsConfigSchema, source).pipe(
      Effect.map((aws) => createAwsS3Delivery({ aws, app })),
    ),
} satisfies Partial<Record<AssetStorageProviderType, CloudflareStorageFactory>>;

const assetErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseAssetConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, AssetError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new AssetError({
        code: 'ASSET_CONFIG_INVALID',
        message: assetErrorMessage(caught),
      }),
  });

const findAssetProviderFactory = (
  provider: AssetHostingProviderType,
): Effect.Effect<AssetProviderFactory, AssetError> => {
  const createProvider = assetProviderFactories[provider];

  if (createProvider === undefined) {
    return Effect.fail(
      new AssetError({
        code: 'ASSET_PROVIDER_UNSUPPORTED',
        message: `No asset delivery adapter is registered for hosting provider ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

const findCloudflareStorageFactory = (
  provider: AssetStorageProviderType,
): Effect.Effect<CloudflareStorageFactory, AssetError> => {
  const createProvider = cloudflareStorageFactories[provider];

  if (createProvider === undefined) {
    return Effect.fail(
      new AssetError({
        code: 'ASSET_PROVIDER_UNSUPPORTED',
        message: `No asset delivery adapter is registered for storage provider ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

const resolveCloudflareStackDelivery = (
  source: EnvSource,
  app: AssetAppConfigType,
): Effect.Effect<AssetDeliveryProvider, AssetError> =>
  parseAssetConfigSlice(AssetStorageConfigSchema, source).pipe(
    Effect.flatMap(({ STORAGE_PROVIDER }) =>
      findCloudflareStorageFactory(STORAGE_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source, app)),
      ),
    ),
  );

/**
 * Resolve the configured asset delivery provider from hosting and storage environment config.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @returns An Effect that succeeds with the selected asset delivery provider or fails with AssetError.
 * @example
 * const provider = await Effect.runPromise(resolveAssetDelivery({ HOSTING_PROVIDER: 'local' }));
 */
export const resolveAssetDelivery = (
  source: EnvSource = process.env,
): Effect.Effect<AssetDeliveryProvider, AssetError> =>
  Effect.all({
    hosting: parseAssetConfigSlice(AssetHostingConfigSchema, source),
    app: parseAssetConfigSlice(AssetAppConfigSchema, source),
  }).pipe(
    Effect.flatMap(({ hosting, app }) =>
      findAssetProviderFactory(hosting.HOSTING_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source, app)),
      ),
    ),
  );

/**
 * Build the configured AssetDelivery Layer from environment config.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @returns A Layer that provides AssetDelivery or fails with AssetError during construction.
 * @example
 * const result = await Effect.runPromise(optimizeAssetsForBuild(options).pipe(Effect.provide(makeAssetDeliveryLive())));
 */
export const makeAssetDeliveryLive = (
  source: EnvSource = process.env,
): Layer.Layer<AssetDelivery, AssetError> =>
  Layer.effect(AssetDelivery, resolveAssetDelivery(source));

/**
 * Optimize build-time assets through the injected asset delivery service.
 *
 * @param options - Build optimizer input paths and manifest name.
 * @returns An Effect that succeeds with an optimization manifest or fails with AssetError.
 * @example
 * const result = await Effect.runPromise(optimizeAssetsForBuild({ sourceDir: 'public' }).pipe(Effect.provide(makeAssetDeliveryLive())));
 */
export const optimizeAssetsForBuild = (
  options: OptimizeBuildOptionsType,
): Effect.Effect<OptimizeBuildResultType, AssetError, AssetDelivery> =>
  Effect.flatMap(AssetDelivery, ({ optimizeForBuild }) => optimizeForBuild(options));

/**
 * Resolve a CDN URL through the injected asset delivery service.
 *
 * @param src - Source asset path or remote URL.
 * @param opts - Optional CDN transform options.
 * @returns An Effect that succeeds with the resolved URL.
 * @example
 * const url = await Effect.runPromise(resolveAssetUrl('/hero.png').pipe(Effect.provide(makeAssetDeliveryLive())));
 */
export const resolveAssetUrl = (
  src: string,
  opts?: AssetUrlOptionsType | undefined,
): Effect.Effect<string, never, AssetDelivery> =>
  Effect.map(AssetDelivery, ({ url }) => url(src, opts));

/**
 * Verify the injected asset delivery service is configured.
 *
 * @returns An Effect that succeeds with true or fails with AssetError.
 * @example
 * const ok = await Effect.runPromise(verifyAssetDelivery().pipe(Effect.provide(makeAssetDeliveryLive())));
 */
export const verifyAssetDelivery = (): Effect.Effect<true, AssetError, AssetDelivery> =>
  Effect.flatMap(AssetDelivery, ({ verifyDelivery }) => verifyDelivery());
