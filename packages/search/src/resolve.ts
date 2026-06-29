import {
  algoliaConfigSchema,
  parseEnv,
  searchConfigSchema,
  typesenseConfigSchema,
} from '@vybekiit/core';
import { createLocalSearch } from './providers/local';
import { createSupabaseSearch } from './providers/supabase';
import type { SearchProvider } from './types';

type EnvSource = Record<string, string | undefined>;

function isSupabaseUnconfigured(env: EnvSource): boolean {
  return !(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export function resolveSearchProvider(env: EnvSource = process.env): SearchProvider {
  const { SEARCH_PROVIDER } = parseEnv(searchConfigSchema, env);
  switch (SEARCH_PROVIDER) {
    case 'typesense':
      parseEnv(typesenseConfigSchema, env);
      throw new Error('typesense search adapter ships in a later step');
    case 'algolia':
      parseEnv(algoliaConfigSchema, env);
      throw new Error('algolia search adapter ships in a later step');
    case 'local':
      return createLocalSearch();
    default:
      if (isSupabaseUnconfigured(env)) return createLocalSearch();
      return createSupabaseSearch();
  }
}
