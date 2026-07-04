import process from 'node:process';
import {
  type EnvSource,
  isSupabaseUnconfigured,
  parseEnv,
  resolveEnvProvider,
  searchConfigSchema,
} from '@vybekiit/core';
import { createLocalSearch } from './providers/local';
import { createSupabaseSearch } from './providers/supabase';
import type { SearchProvider } from './types';

/** typesense/algolia registry entries resolve to local until those adapters ship (ADR-0012). */
export function resolveSearchProvider(env: EnvSource = process.env): SearchProvider {
  const { SEARCH_PROVIDER } = parseEnv(searchConfigSchema, env);
  return resolveEnvProvider(
    SEARCH_PROVIDER,
    {
      typesense: () => createLocalSearch(),
      algolia: () => createLocalSearch(),
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
