import { QueryClient } from '@tanstack/react-query';

import type { ClientStateConfig } from '@vybekiit/client-state/config';

/** Shared TanStack Query defaults for every generated client surface. */
export const defaultQueryOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: true,
  },
} as const;

/**
 * Create a TanStack Query client from client-state config.
 *
 * @param config - Parsed client-state config slice.
 * @returns QueryClient with the configured stale time.
 * @example
 * const client = createQueryClient({ CLIENT_STATE_QUERY_STALE_SECONDS: 60 });
 */
export const createQueryClient = (
  config: Pick<ClientStateConfig, 'CLIENT_STATE_QUERY_STALE_SECONDS'>,
): QueryClient => {
  const staleMs = config.CLIENT_STATE_QUERY_STALE_SECONDS * 1000;
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...defaultQueryOptions.queries,
        staleTime: staleMs,
      },
    },
  });
};
