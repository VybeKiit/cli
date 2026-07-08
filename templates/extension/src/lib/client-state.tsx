'use client';

import { resolveClientState } from '@vybekiit/client-state';
import { createWebQueryPersister } from '@vybekiit/client-state/web';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

const resolved = resolveClientState('extension');

const queryPersister = resolved.persistEnabled ? createWebQueryPersister() : null;

/**
 * Provide the extension React Query client and persisted cache.
 *
 * @param props - Provider props containing the app tree.
 * @returns A React Query provider for extension screens.
 * @example
 * <ClientStateProvider>{children}</ClientStateProvider>
 */
export const ClientStateProvider = ({ children }: { children: ReactNode }) => {
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
