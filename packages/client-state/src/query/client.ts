import { QueryClient } from '@tanstack/react-query';

import type { ClientStateConfig } from '@vybekiit/core';

export const defaultQueryOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: true,
  },
} as const;

export function createQueryClient(
  config: Pick<ClientStateConfig, 'CLIENT_STATE_QUERY_STALE_SECONDS'>,
) {
  const staleMs = config.CLIENT_STATE_QUERY_STALE_SECONDS * 1000;
  return new QueryClient({
    defaultOptions: {
      queries: {
        ...defaultQueryOptions.queries,
        staleTime: staleMs,
      },
    },
  });
}
