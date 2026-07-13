'use client';

import { AppSidebar } from '@library/components/shell/AppSidebar';
import { AppTopBar } from '@library/components/shell/AppTopBar';
import { SidebarInset, SidebarProvider } from '@vybekiit/ui/sidebar';
import { type ReactNode, Suspense } from 'react';

/**
 * The one shell shared by every browsable library route: a persistent contextual sidebar plus a
 * top bar with cross-section nav and theme controls, wrapping the section content. `embed/*` stays
 * outside the `(library)` route group, so previews remain chrome-less. The sidebar reads the URL
 * (`useSearchParams`), so it sits behind a Suspense boundary.
 *
 * @param props - The section content to render inside the inset.
 * @returns The library app shell.
 * @example
 * <AppShell>{page}</AppShell>
 */
export const AppShell = ({ children }: { readonly children: ReactNode }) => (
  <SidebarProvider defaultOpen={true}>
    <Suspense fallback={null}>
      <AppSidebar />
    </Suspense>
    <SidebarInset>
      <AppTopBar />
      {children}
    </SidebarInset>
  </SidebarProvider>
);
