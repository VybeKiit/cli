import { Effect, type Schema } from 'effect';
import { parseEnv } from './config';
import type { EnvSource } from './envSource';

/**
 * Error codes produced by {@link resolveProviderEffect} when config or registry lookup fails.
 */
export type ProviderDispatchErrorCode = 'CONFIG_INVALID' | 'PROVIDER_UNSUPPORTED';

/**
 * Build a tagged-error constructor for provider dispatch failures.
 *
 * Callers pass their concern's `Data.TaggedError` constructor so the deep dispatch
 * module stays free of any one package's error type.
 *
 * @typeParam E - Concern tagged error type.
 */
export type ProviderDispatchErrorFactory<E> = (input: {
  readonly code: ProviderDispatchErrorCode;
  readonly message: string;
}) => E;

/**
 * Inputs for {@link resolveProviderEffect}.
 *
 * @typeParam P - Provider/service type returned by factories.
 * @typeParam K - Provider key type (usually a Schema.Literal union).
 * @typeParam E - Tagged error channel for the concern.
 * @typeParam C - Parsed config object type.
 */
export type ResolveProviderEffectOptions<
  P,
  K extends string,
  E,
  C extends Record<string, unknown> = Record<string, unknown>,
  I = unknown,
> = {
  /** Raw environment (or test fixture) to parse. */
  readonly source: EnvSource;
  /** Schema that yields at least the provider key field. */
  readonly configSchema: Schema.Schema<C, I>;
  /** Field on the parsed config that holds the provider name. */
  readonly providerKey: keyof C & string;
  /** Factory map keyed by provider name. Missing keys → PROVIDER_UNSUPPORTED. */
  readonly factories: Readonly<Partial<Record<K, (source: EnvSource, config: C) => P>>>;
  /** Builds a tagged error for config/registry failures. */
  readonly toError: ProviderDispatchErrorFactory<E>;
};

/**
 * Parse a config slice, look up the adapter factory, and construct the provider.
 *
 * This is the Effect-native dispatch SSOT (ADR-0018 + ADR-0023). Concern packages
 * shrink to a Tag, a factory map, and a thin `resolve*FromEnv` / `make*Live` wrapper.
 *
 * @typeParam P - Provider/service type.
 * @typeParam K - Provider key string union.
 * @typeParam E - Tagged error type.
 * @param options - Schema, key, factories, and error factory.
 * @returns Effect that succeeds with the provider or fails with a tagged error.
 * @example
 * const seo = resolveProviderEffect({
 *   source: process.env,
 *   configSchema: SeoConfigSchema,
 *   providerKey: 'SEO_PROVIDER',
 *   factories: { local: (src, cfg) => createLocalSeo(cfg) },
 *   toError: (input) => new SeoError(input),
 * });
 */
export const resolveProviderEffect = <
  P,
  K extends string,
  E,
  C extends Record<string, unknown> = Record<string, unknown>,
  I = unknown,
>(
  options: ResolveProviderEffectOptions<P, K, E, C, I>,
): Effect.Effect<P, E> => {
  const { source, configSchema, providerKey, factories, toError } = options;

  return Effect.gen(function* () {
    const config = yield* Effect.try({
      try: () => parseEnv(configSchema, source),
      catch: (caught) =>
        toError({
          code: 'CONFIG_INVALID',
          message: caught instanceof Error ? caught.message : String(caught),
        }),
    });

    const key = config[providerKey] as K | undefined;
    if (key === undefined || String(key) === '') {
      return yield* Effect.fail(
        toError({
          code: 'CONFIG_INVALID',
          message: `Missing provider key "${providerKey}".`,
        }),
      );
    }

    const factory = factories[key];
    if (factory === undefined) {
      return yield* Effect.fail(
        toError({
          code: 'PROVIDER_UNSUPPORTED',
          message: `No provider is registered for ${String(key)}.`,
        }),
      );
    }

    return yield* Effect.try({
      try: () => factory(source, config),
      catch: (caught) =>
        toError({
          code: 'CONFIG_INVALID',
          message: caught instanceof Error ? caught.message : String(caught),
        }),
    });
  });
};

/**
 * Resolve a provider when config is already parsed (multi-schema concerns).
 *
 * @typeParam P - Provider type.
 * @typeParam K - Provider key.
 * @typeParam E - Tagged error.
 * @param providerKey - Selected provider name.
 * @param factories - Factory map.
 * @param source - Env passed to factories that still need raw env.
 * @param config - Parsed config object passed to factories.
 * @param toError - Tagged error factory.
 * @returns Effect with the constructed provider.
 * @example
 * const provider = lookupProviderFactory('local', factories, env, config, toError);
 */
export const lookupProviderFactory = <P, K extends string, E>(
  providerKey: K,
  factories: Readonly<
    Partial<Record<K, (source: EnvSource, config: Record<string, unknown>) => P>>
  >,
  source: EnvSource,
  config: Record<string, unknown>,
  toError: ProviderDispatchErrorFactory<E>,
): Effect.Effect<P, E> => {
  const factory = factories[providerKey];
  if (factory === undefined) {
    return Effect.fail(
      toError({
        code: 'PROVIDER_UNSUPPORTED',
        message: `No provider is registered for ${String(providerKey)}.`,
      }),
    );
  }

  return Effect.try({
    try: () => factory(source, config),
    catch: (caught) =>
      toError({
        code: 'CONFIG_INVALID',
        message: caught instanceof Error ? caught.message : String(caught),
      }),
  });
};
