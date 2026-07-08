'use client';

import { resolveClientState } from '@vybekiit/client-state';
import { createMmkvQueryPersister } from '@vybekiit/client-state/mobile';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';

const resolved = resolveClientState('mobile');

const queryPersister = resolved.persistEnabled
  ? createMmkvQueryPersister(new MMKV({ id: 'vybekiit-query-cache' }))
  : null;

/**
 * Provide the mobile React Query client and persisted cache.
 *
 * @param props - Provider props containing the app tree.
 * @returns A React Query provider for mobile screens.
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

export { resolved as clientState };
