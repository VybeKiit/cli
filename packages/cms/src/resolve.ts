import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import { CmsConfig, type CmsProviderNameType, MdxCmsConfig } from './config';
import { createMdxCms } from './providers/mdx';
import { CmsError, type CmsProvider, type CmsService } from './types';

/** Injectable CMS service tag used by composition roots and tests. */
export class Cms extends Context.Tag('@vybekiit/cms/Cms')<Cms, CmsService>() {}

type CmsFactory = (source: EnvSource) => Effect.Effect<CmsService, CmsError>;

const cmsFactories = {
  mdx: (source) => parseCmsConfigSlice(MdxCmsConfig, source).pipe(Effect.map(createMdxCms)),
  local: () => Effect.succeed(createLocalCms()),
} satisfies Record<CmsProviderNameType, CmsFactory>;

const cmsErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseCmsConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, CmsError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new CmsError({
        code: 'CMS_CONFIG_INVALID',
        message: cmsErrorMessage(caught),
      }),
  });

const findCmsFactory = (provider: CmsProviderNameType): Effect.Effect<CmsFactory, CmsError> => {
  const createProvider = cmsFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new CmsError({
        code: 'CMS_PROVIDER_UNSUPPORTED',
        message: `No CMS provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

const createLocalCms = (): CmsService => ({
  name: 'local',
  getPage: () => Effect.succeed(null),
  listPages: () => Effect.succeed([]),
  getMetadata: () => Effect.succeed(null),
});

const toPromiseCmsProvider = (service: CmsService): CmsProvider => ({
  name: service.name,
  getPage: (slug) => Effect.runPromise(service.getPage(slug)),
  listPages: () => Effect.runPromise(service.listPages()),
  getMetadata: (slug) => Effect.runPromise(service.getMetadata(slug)),
});

/**
 * Resolve the configured CMS service from environment values.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @returns An Effect that succeeds with the configured CMS service or fails with CmsError.
 * @example
 * const cms = await Effect.runPromise(resolveCmsService({ CMS_PROVIDER: 'mdx' }));
 */
export const resolveCmsService = (
  source: EnvSource = process.env,
): Effect.Effect<CmsService, CmsError> =>
  parseCmsConfigSlice(CmsConfig, source).pipe(
    Effect.flatMap(({ CMS_PROVIDER }) =>
      findCmsFactory(CMS_PROVIDER).pipe(Effect.flatMap((createProvider) => createProvider(source))),
    ),
  );

/**
 * Build the configured CMS Layer from environment values.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @returns A Layer that provides Cms or fails with CmsError during construction.
 * @example
 * const layer = makeCmsLive({ CMS_PROVIDER: 'mdx' });
 */
export const makeCmsLive = (source: EnvSource = process.env): Layer.Layer<Cms, CmsError> =>
  Layer.effect(Cms, resolveCmsService(source));

/**
 * Resolve the current CMS service into the deprecated Promise provider shape.
 *
 * @param source - Environment object to parse, usually `process.env` in templates.
 * @returns Promise-based CMS provider kept while templates migrate to Effect.
 * @example
 * const cms = createCmsFromEnv({ CMS_PROVIDER: 'mdx', CMS_CONTENT_DIR: 'content' });
 */
export const createCmsFromEnv = (source: EnvSource = process.env): CmsProvider =>
  toPromiseCmsProvider(Effect.runSync(resolveCmsService(source)));

/** @deprecated Use {@link createCmsFromEnv}; kept for existing template imports. */
export const resolveCmsProvider = createCmsFromEnv;
