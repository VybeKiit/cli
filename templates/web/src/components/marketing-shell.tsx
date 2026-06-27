import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { ReactNode } from 'react';

/** Page shell for public marketing pages: header, content, footer. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
