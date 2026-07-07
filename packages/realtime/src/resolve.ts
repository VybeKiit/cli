import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import { RealtimeConfigSchema, type RealtimeConfigType } from './config';
import { createLocalRealtime } from './providers/local';
import { RealtimeError, type RealtimeProvider, type RealtimeService } from './types';

/** Injectable realtime service tag used by composition roots and tests. */
export class Realtime extends Context.Tag('@vybekiit/realtime/Realtime')<
  Realtime,
  RealtimeService
>() {}

type RealtimeFactory = (source: EnvSource) => Effect.Effect<RealtimeService, RealtimeError>;

const realtimeFactories: Partial<Record<RealtimeConfigType['REALTIME_PROVIDER'], RealtimeFactory>> =
  {
    local: () => Effect.succeed(createLocalRealtime()),
  };

const realtimeErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseRealtimeConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, RealtimeError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new RealtimeError({
        code: 'REALTIME_CONFIG_INVALID',
        message: realtimeErrorMessage(caught),
      }),
  });

const findRealtimeFactory = (
  provider: RealtimeConfigType['REALTIME_PROVIDER'],
): Effect.Effect<RealtimeFactory, RealtimeError> => {
  const createProvider = realtimeFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new RealtimeError({
        code: 'REALTIME_PROVIDER_UNSUPPORTED',
        message: `No realtime provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured realtime service from an environment source.
 *
 * @param source - Environment variables used to select the realtime provider.
 * @returns An Effect that succeeds with the configured realtime service or fails with RealtimeError.
 * @example
 * const realtime = await Effect.runPromise(resolveRealtimeService({ REALTIME_PROVIDER: 'local' }));
 */
export const resolveRealtimeService = (
  source: EnvSource = process.env,
): Effect.Effect<RealtimeService, RealtimeError> =>
  parseRealtimeConfigSlice(RealtimeConfigSchema, source).pipe(
    Effect.flatMap(({ REALTIME_PROVIDER }) =>
      findRealtimeFactory(REALTIME_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source)),
      ),
    ),
  );

/**
 * Build the configured realtime Layer from environment values.
 *
 * @param source - Environment variables used to select the realtime provider.
 * @returns A Layer that provides Realtime or fails with RealtimeError during construction.
 * @example
 * const layer = makeRealtimeLive({ REALTIME_PROVIDER: 'local' });
 */
export const makeRealtimeLive = (
  source: EnvSource = process.env,
): Layer.Layer<Realtime, RealtimeError> => Layer.effect(Realtime, resolveRealtimeService(source));

/**
 * Resolve the configured realtime provider from an environment source.
 *
 * @param source - Environment variables used to select the realtime provider.
 * @returns The realtime provider registered for `REALTIME_PROVIDER`.
 * @throws When the selected provider has no registered adapter.
 * @example
 * const realtime = resolveRealtimeProvider(process.env);
 */
export const resolveRealtimeProvider = (source: EnvSource = process.env): RealtimeProvider =>
  Effect.runSync(resolveRealtimeService(source));
