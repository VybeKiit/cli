import process from 'node:process';
import { type EnvSource, isSupabaseUnconfigured, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import { SearchConfigSchema, type SearchConfigType } from './config';
import { createLocalSearch } from './providers/local';
import { createSupabaseSearch } from './providers/supabase';
import { SearchError, type SearchProvider, type SearchService } from './types';

/** Injectable search service tag used by composition roots and tests. */
export class Search extends Context.Tag('@vybekiit/db/search/Search')<Search, SearchService>() {}

type SearchFactory = (source: EnvSource) => Effect.Effect<SearchService, SearchError>;

const searchFactories: Partial<Record<SearchConfigType['SEARCH_PROVIDER'], SearchFactory>> = {
  local: () => Effect.succeed(createLocalSearch()),
  supabase: (source) => {
    if (isSupabaseUnconfigured(source)) {
      return Effect.succeed(createLocalSearch());
    }

    return Effect.succeed(createSupabaseSearch());
  },
};

const searchErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseSearchConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, SearchError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new SearchError({
        code: 'SEARCH_CONFIG_INVALID',
        message: searchErrorMessage(caught),
      }),
  });

const findSearchFactory = (
  provider: SearchConfigType['SEARCH_PROVIDER'],
): Effect.Effect<SearchFactory, SearchError> => {
  const createProvider = searchFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new SearchError({
        code: 'SEARCH_PROVIDER_UNSUPPORTED',
        message: `No search provider is registered for ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured search service from an environment source.
 *
 * @param source - Environment variables used to select and configure search.
 * @returns An Effect that succeeds with the configured search service or fails with SearchError.
 * @example
 * const search = await Effect.runPromise(resolveSearchService({ SEARCH_PROVIDER: 'local' }));
 */
export const resolveSearchService = (
  source: EnvSource = process.env,
): Effect.Effect<SearchService, SearchError> =>
  parseSearchConfigSlice(SearchConfigSchema, source).pipe(
    Effect.flatMap(({ SEARCH_PROVIDER }) =>
      findSearchFactory(SEARCH_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source)),
      ),
    ),
  );

/**
 * Build the configured search Layer from environment values.
 *
 * @param source - Environment variables used to select and configure search.
 * @returns A Layer that provides Search or fails with SearchError during construction.
 * @example
 * const layer = makeSearchLive({ SEARCH_PROVIDER: 'local' });
 */
export const makeSearchLive = (source: EnvSource = process.env): Layer.Layer<Search, SearchError> =>
  Layer.effect(Search, resolveSearchService(source));

/**
 * Resolve the configured search provider from an environment source.
 * @param source - Environment variables used to select and configure search.
 * @returns The search provider registered for `SEARCH_PROVIDER`.
 * @throws When the selected provider has no shipped adapter.
 * @example
 * const search = resolveSearchProvider(process.env);
 */
export const resolveSearchProvider = (source: EnvSource = process.env): SearchProvider =>
  Effect.runSync(resolveSearchService(source));
