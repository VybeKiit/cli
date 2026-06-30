import {
  algoliaConfigSchema,
  isSupabaseUnconfigured,
  parseEnv,
  resolveEnvProvider,
  searchConfigSchema,
  typesenseConfigSchema,
  type EnvSource,
} from '@vybekiit/core';
import { createLocalSearch } from './providers/local';
import { createSupabaseSearch } from './providers/supabase';
import type { SearchProvider } from './types';

export function resolveSearchProvider(env: EnvSource = process.env): SearchProvider {
  const { SEARCH_PROVIDER } = parseEnv(searchConfigSchema, env);
  return resolveEnvProvider(
    SEARCH_PROVIDER,
    {
      typesense: () => {
        parseEnv(typesenseConfigSchema, env);
        throw new Error('typesense search adapter ships in a later step');
      },
      algolia: () => {
        parseEnv(algoliaConfigSchema, env);
        throw new Error('algolia search adapter ships in a later step');
      },
      local: () => createLocalSearch(),
      supabase: (source) => {
        if (isSupabaseUnconfigured(source)) return createLocalSearch();
        return createSupabaseSearch();
      },
    },
    env,
    'supabase',
  );
}
