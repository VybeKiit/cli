import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

/** Page shell for the store's public pages: header, content, footer. */
export const MarketingShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </div>
);
