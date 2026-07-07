import { resolveClientState } from '@vybekiit/client-state';
import { createWebQueryPersister } from '@vybekiit/client-state/web';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

interface ClientStateProviderProps {
  readonly children?: ReactNode;
}

const resolved = resolveClientState('spa');

const queryPersister = resolved.persistEnabled ? createWebQueryPersister() : null;

/**
 * Provides React Query client state and persistence for the SPA template.
 *
 * @param props - Provider props.
 * @returns A client-state provider wrapping the supplied children.
 * @example
 * ```tsx
 * <ClientStateProvider>
 *   <App />
 * </ClientStateProvider>
 * ```
 */
export const ClientStateProvider = ({ children = null }: ClientStateProviderProps) => {
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

/** Resolved client-state configuration for the SPA template. */
export { resolved as clientState };
