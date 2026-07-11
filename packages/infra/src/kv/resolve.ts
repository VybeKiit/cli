import process from 'node:process';
import { type EnvSource, isCloudflareUnconfigured, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  KvCloudflareConfigSchema,
  KvConfigSchema,
  type KvConfigType,
  type KvProviderNameType,
} from './config';
import { createCloudflareKv } from './providers/cloudflare';
import { createLocalKv } from './providers/local';
import { KvError, type KvProvider, type KvService } from './types';

/** Injectable KV service tag used by composition roots and tests. */
export class Kv extends Context.Tag('@vybekiit/infra/kv/Kv')<Kv, KvService>() {}

type KvFactory = (source: EnvSource) => Effect.Effect<KvService, KvError>;

const kvFactories: Partial<Record<KvProviderNameType, KvFactory>> = {
  cloudflare: (source) => {
    if (isCloudflareUnconfigured(source)) {
      return Effect.succeed(createLocalKv());
    }
    return parseKvConfigSlice(KvCloudflareConfigSchema, source).pipe(
      Effect.map((config) => createCloudflareKv(config)),
    );
  },
  local: () => Effect.succeed(createLocalKv()),
};

const kvErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseKvConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, KvError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new KvError({
        code: 'KV_CONFIG_INVALID',
        message: kvErrorMessage(caught),
      }),
  });

const findKvFactory = (provider: KvProviderNameType): Effect.Effect<KvFactory, KvError> => {
  const createProvider = kvFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new KvError({
        code: 'KV_PROVIDER_UNSUPPORTED',
        message: `No KV provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured KV service from environment config.
 *
 * @param source - Raw environment source to decode.
 * @returns An Effect that succeeds with the configured KV service or fails with KvError.
 * @example
 * const kv = await Effect.runPromise(resolveKvService({ KV_PROVIDER: 'local' }));
 */
export const resolveKvService = (
  source: EnvSource = process.env,
): Effect.Effect<KvService, KvError> =>
  parseKvConfigSlice(KvConfigSchema, source).pipe(
    Effect.flatMap(({ KV_PROVIDER }: KvConfigType) =>
      findKvFactory(KV_PROVIDER).pipe(Effect.flatMap((createProvider) => createProvider(source))),
    ),
  );

/**
 * Build the configured KV Layer from environment values.
 *
 * @param source - Raw environment source to decode.
 * @returns A Layer that provides Kv or fails with KvError during construction.
 * @example
 * const layer = makeKvLive({ KV_PROVIDER: 'local' });
 */
export const makeKvLive = (source: EnvSource = process.env): Layer.Layer<Kv, KvError> =>
  Layer.effect(Kv, resolveKvService(source));

/**
 * Resolve the configured KV provider from environment config.
 *
 * @param source - Raw environment source to decode.
 * @returns Configured KV provider.
 * @example
 * const kv = resolveKvProvider(process.env);
 */
export const resolveKvProvider = (source: EnvSource = process.env): KvProvider =>
  Effect.runSync(resolveKvService(source));
