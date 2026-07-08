'use client';

import { resolveClientState } from '@vybekiit/client-state';
import { createWebQueryPersister } from '@vybekiit/client-state/web';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

const resolved = resolveClientState('web');

const queryPersister = resolved.persistEnabled ? createWebQueryPersister() : null;

interface ClientStateProviderProps {
  readonly children?: ReactNode;
}

/**
 * Provide the shared TanStack Query client to client components.
 *
 * @param props - Optional React subtree that needs client state.
 * @returns Query provider tree with persistence when enabled.
 * @example
 * <ClientStateProvider><App /></ClientStateProvider>
 */
const ClientStateProvider = ({ children = null }: ClientStateProviderProps) => {
  const [queryClient] = useState(() => resolved.queryClient);

  if (queryPersister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export { resolved as clientState };
export { ClientStateProvider };
