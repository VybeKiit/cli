import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  AnalyticsConfigSchema,
  type AnalyticsConfigType,
  type AnalyticsProviderNameType,
  PlausibleConfigSchema,
  PosthogConfigSchema,
} from './config';
import { createLocalAnalytics } from './providers/local';
import { createPlausibleAnalytics } from './providers/plausible';
import { createPosthogAnalytics } from './providers/posthog';
import {
  AnalyticsError,
  type AnalyticsProvider,
  type AnalyticsService,
  type ScriptConfigType,
  type TrackEventType,
} from './types';

/** Injectable analytics service tag used by composition roots and tests. */
export class Analytics extends Context.Tag('@vybekiit/analytics/Analytics')<
  Analytics,
  AnalyticsService
>() {}

type AnalyticsProviderFactory = (
  source: EnvSource,
) => Effect.Effect<AnalyticsProvider, AnalyticsError>;

const analyticsProviderFactories = {
  local: () => Effect.succeed(createLocalAnalytics()),
  plausible: (source) =>
    parseAnalyticsConfigSlice(PlausibleConfigSchema, source).pipe(
      Effect.map((config) => createPlausibleAnalytics(config)),
    ),
  posthog: (source) =>
    parseAnalyticsConfigSlice(PosthogConfigSchema, source).pipe(
      Effect.map((config) => createPosthogAnalytics(config)),
    ),
} satisfies Partial<Record<AnalyticsProviderNameType, AnalyticsProviderFactory>>;

const analyticsErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseAnalyticsConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, AnalyticsError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new AnalyticsError({
        code: 'ANALYTICS_CONFIG_INVALID',
        message: analyticsErrorMessage(caught),
      }),
  });

const findAnalyticsProviderFactory = (
  provider: AnalyticsProviderNameType,
): Effect.Effect<AnalyticsProviderFactory, AnalyticsError> => {
  const createProvider = analyticsProviderFactories[provider];

  if (createProvider === undefined) {
    return Effect.fail(
      new AnalyticsError({
        code: 'ANALYTICS_PROVIDER_UNSUPPORTED',
        message: `No analytics adapter is registered for provider ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured analytics provider from environment config.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @returns An Effect that succeeds with the selected analytics provider or fails with AnalyticsError.
 * @example
 * const provider = await Effect.runPromise(resolveAnalyticsProvider({ ANALYTICS_PROVIDER: 'local' }));
 */
export const resolveAnalyticsProvider = (
  source: EnvSource = process.env,
): Effect.Effect<AnalyticsProvider, AnalyticsError> =>
  parseAnalyticsConfigSlice(AnalyticsConfigSchema, source).pipe(
    Effect.flatMap(({ ANALYTICS_PROVIDER }: AnalyticsConfigType) =>
      findAnalyticsProviderFactory(ANALYTICS_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source)),
      ),
    ),
  );

/**
 * Build the configured Analytics Layer from environment config.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @returns A Layer that provides Analytics or fails with AnalyticsError during construction.
 * @example
 * const result = await Effect.runPromise(trackAnalyticsEvent(event).pipe(Effect.provide(makeAnalyticsLive())));
 */
export const makeAnalyticsLive = (
  source: EnvSource = process.env,
): Layer.Layer<Analytics, AnalyticsError> =>
  Layer.effect(Analytics, resolveAnalyticsProvider(source));

/**
 * Track one analytics event through the injected analytics service.
 *
 * @param event - Validated analytics event payload.
 * @returns An Effect that completes when the event is accepted or fails with AnalyticsError.
 * @example
 * await Effect.runPromise(trackAnalyticsEvent({ name: 'signup_completed' }).pipe(Effect.provide(makeAnalyticsLive())));
 */
export const trackAnalyticsEvent = (
  event: TrackEventType,
): Effect.Effect<void, AnalyticsError, Analytics> =>
  Effect.flatMap(Analytics, ({ track }) => track(event));

/**
 * Identify one analytics user through the injected analytics service.
 *
 * @param userId - Stable user identifier known by the app.
 * @param traits - Optional analytics traits for the user.
 * @returns An Effect that completes when the user is accepted or fails with AnalyticsError.
 * @example
 * await Effect.runPromise(identifyAnalyticsUser('user_1').pipe(Effect.provide(makeAnalyticsLive())));
 */
export const identifyAnalyticsUser = (
  userId: string,
  traits?: Record<string, string> | undefined,
): Effect.Effect<void, AnalyticsError, Analytics> =>
  Effect.flatMap(Analytics, ({ identify }) => identify(userId, traits));

/**
 * Read browser script config from the injected analytics service.
 *
 * @returns An Effect that succeeds with script config, null for local, or fails with AnalyticsError.
 * @example
 * const config = await Effect.runPromise(getAnalyticsScriptConfig().pipe(Effect.provide(makeAnalyticsLive())));
 */
export const getAnalyticsScriptConfig = (): Effect.Effect<
  ScriptConfigType | null,
  AnalyticsError,
  Analytics
> => Effect.flatMap(Analytics, ({ getScriptConfig }) => getScriptConfig());
