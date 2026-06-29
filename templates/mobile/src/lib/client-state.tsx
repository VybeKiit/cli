'use client';

import { resolveClientState } from '@vybekiit/client-state';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const resolved = resolveClientState('mobile');

export function ClientStateProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => resolved.queryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { resolved as clientState };
