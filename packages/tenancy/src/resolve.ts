import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import { TenancyConfigSchema, type TenancyConfigType } from './config';
import { createBetterAuthTenancy, type ResolveTenancyInjections } from './providers/betterAuth';
import { createLocalTenancy } from './providers/local';
import { TenancyError, type TenancyProvider, type TenancyService } from './types';

/** The tenancy provider as an injectable service for Effect composition roots. */
export class Tenancy extends Context.Tag('@vybekiit/tenancy/Tenancy')<Tenancy, TenancyService>() {}

type TenancyFactory = (
  source: EnvSource,
  injections: ResolveTenancyInjections,
) => Effect.Effect<TenancyService, TenancyError>;

const tenancyFactories: Partial<Record<TenancyConfigType['TENANCY_PROVIDER'], TenancyFactory>> = {
  local: () => Effect.succeed(createLocalTenancy()),
  'better-auth': (_source, injections) =>
    Effect.try({
      try: () => createBetterAuthTenancy(injections),
      catch: (caught) =>
        new TenancyError({
          code: 'TENANCY_CONFIG_INVALID',
          message: tenancyErrorMessage(caught),
        }),
    }),
};

const tenancyErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseTenancyConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, TenancyError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new TenancyError({
        code: 'TENANCY_CONFIG_INVALID',
        message: tenancyErrorMessage(caught),
      }),
  });

const findTenancyFactory = (
  provider: TenancyConfigType['TENANCY_PROVIDER'],
): Effect.Effect<TenancyFactory, TenancyError> => {
  const createProvider = tenancyFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new TenancyError({
        code: 'TENANCY_PROVIDER_UNSUPPORTED',
        message: `No tenancy provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured tenancy service from an environment source.
 *
 * @param source - Environment variables used to select the tenancy adapter.
 * @param injections - Optional dependencies for tests and custom composition roots.
 * @returns An Effect that succeeds with the configured tenancy service or fails with TenancyError.
 * @example
 * const tenancy = await Effect.runPromise(resolveTenancyService({ TENANCY_PROVIDER: 'local' }));
 */
export const resolveTenancyService = (
  source: EnvSource = process.env,
  injections: ResolveTenancyInjections = {},
): Effect.Effect<TenancyService, TenancyError> =>
  parseTenancyConfigSlice(TenancyConfigSchema, source).pipe(
    Effect.flatMap(({ TENANCY_PROVIDER }) =>
      findTenancyFactory(TENANCY_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source, injections)),
      ),
    ),
  );

/**
 * Resolve the configured tenancy provider from an environment source.
 *
 * @param source - Environment variables used to select the tenancy adapter.
 * @param injections - Optional dependencies for tests and custom composition roots.
 * @returns The tenancy provider registered for `TENANCY_PROVIDER`.
 * @throws When the selected provider has no shipped adapter.
 * @example
 * const tenancy = resolveTenancyProvider(process.env);
 */
export const resolveTenancyProvider = (
  source: EnvSource = process.env,
  injections: ResolveTenancyInjections = {},
): TenancyProvider => Effect.runSync(resolveTenancyService(source, injections));

/**
 * Build the live {@link Tenancy} layer from an environment source.
 *
 * @param source - Environment variables used by {@link resolveTenancyProvider}.
 * @param injections - Optional dependencies for tests and custom composition roots.
 * @returns A Layer that provides the configured {@link Tenancy} service.
 * @example
 * const layer = makeTenancyLive(process.env);
 */
export const makeTenancyLive = (
  source: EnvSource = process.env,
  injections: ResolveTenancyInjections = {},
): Layer.Layer<Tenancy, TenancyError> =>
  Layer.effect(Tenancy, resolveTenancyService(source, injections));
