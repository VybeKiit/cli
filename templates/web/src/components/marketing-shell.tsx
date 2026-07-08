import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { ReactNode } from 'react';

interface MarketingShellProps {
  readonly children?: ReactNode;
}

/**
 * Render the public marketing page shell.
 *
 * @param props - Optional page content rendered between header and footer.
 * @returns Marketing chrome with a flexible main area.
 * @example
 * <MarketingShell><HomePage /></MarketingShell>
 */
const MarketingShell = ({ children = null }: MarketingShellProps) => (
  <div className="flex min-h-screen flex-col">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </div>
);

export { MarketingShell };
