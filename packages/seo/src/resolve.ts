import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  SeoAppConfigSchema,
  type SeoAppConfigType,
  SeoConfigSchema,
  type SeoConfigType,
} from './config';
import { createLocalSeo } from './providers/local';
import { SeoError, type SeoProvider, type SeoService } from './types';

/** Injectable SEO service tag used by composition roots and tests. */
export class Seo extends Context.Tag('@vybekiit/seo/Seo')<Seo, SeoService>() {}

type SeoFactory = (app: SeoAppConfigType, config: SeoConfigType) => SeoService;

const seoFactories = {
  local: createLocalSeo,
} satisfies Partial<Record<SeoConfigType['SEO_PROVIDER'], SeoFactory>>;

const seoErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseSeoConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, SeoError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new SeoError({
        code: 'SEO_CONFIG_INVALID',
        message: seoErrorMessage(caught),
      }),
  });

const findSeoFactory = (
  provider: SeoConfigType['SEO_PROVIDER'],
): Effect.Effect<SeoFactory, SeoError> => {
  const createProvider = seoFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new SeoError({
        code: 'SEO_PROVIDER_UNSUPPORTED',
        message: `No SEO provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured SEO service from an environment source.
 *
 * @param source - Environment variables used to select and configure SEO helpers.
 * @returns An Effect that succeeds with the configured SEO service or fails with SeoError.
 * @example
 * const seo = await Effect.runPromise(resolveSeoService({ APP_URL: 'https://example.com' }));
 */
export const resolveSeoService = (
  source: EnvSource = process.env,
): Effect.Effect<SeoService, SeoError> =>
  Effect.all({
    seo: parseSeoConfigSlice(SeoConfigSchema, source),
    app: parseSeoConfigSlice(SeoAppConfigSchema, source),
  }).pipe(
    Effect.flatMap(({ seo, app }) =>
      findSeoFactory(seo.SEO_PROVIDER).pipe(
        Effect.map((createProvider) => createProvider(app, seo)),
      ),
    ),
  );

/**
 * Build the configured SEO Layer from environment values.
 *
 * @param source - Environment variables used to select and configure SEO helpers.
 * @returns A Layer that provides Seo or fails with SeoError during construction.
 * @example
 * const layer = makeSeoLive({ APP_URL: 'https://example.com' });
 */
export const makeSeoLive = (source: EnvSource = process.env): Layer.Layer<Seo, SeoError> =>
  Layer.effect(Seo, resolveSeoService(source));

/**
 * Build the configured SEO provider from an environment source.
 *
 * @param source - Environment variables used to select and configure SEO helpers.
 * @returns The SEO provider registered for `SEO_PROVIDER`.
 * @example
 * const seo = createSeoFromEnv(process.env);
 */
export const createSeoFromEnv = (source: EnvSource = process.env): SeoProvider =>
  Effect.runSync(resolveSeoService(source));

/**
 * Resolve the configured SEO provider.
 *
 * @param source - Environment variables used to select and configure SEO helpers.
 * @returns The SEO provider registered for `SEO_PROVIDER`.
 * @deprecated Use {@link createSeoFromEnv}.
 * @example
 * const seo = resolveSeoProvider(process.env);
 */
export const resolveSeoProvider = createSeoFromEnv;
