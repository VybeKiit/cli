import { AppShell } from '@library/components/shell/AppShell';
import type { ReactNode } from 'react';

/**
 * Wraps every browsable library route in the shared shell (top bar + contextual sidebar). Lives in
 * the `(library)` route group so `app/embed/*` stays outside it and keeps rendering chrome-less.
 *
 * @param props - The nested route content.
 * @returns The shared library shell around the route.
 * @example
 * <LibraryLayout>{page}</LibraryLayout>
 */
const LibraryLayout = ({ children }: { readonly children: ReactNode }) => (
  <AppShell>{children}</AppShell>
);

export default LibraryLayout;
