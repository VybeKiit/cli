'use client';

import { memo, type ReactNode } from 'react';
import { CheckoutDialogProvider } from '@/components/CheckoutDialog';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

interface MarketingShellProps {
  readonly children: ReactNode;
}

/**
 * Memoized chrome under ThemeProvider so a theme flip only re-renders
 * `useTheme()` consumers (the toggle), not the whole marketing tree.
 */
const MarketingChrome = memo(({ children }: MarketingShellProps) => (
  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
    <CheckoutDialogProvider>
      <div className="visitor-light flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CheckoutDialogProvider>
  </TooltipProvider>
));
MarketingChrome.displayName = 'MarketingChrome';

/**
 * Marketing page shell for the store: theme, header, content, footer.
 * Class name `visitor-light` scopes mockup CSS; tokens follow light/dark via `html.dark`.
 * Checkout CTAs open an in-page dialog via {@link CheckoutDialogProvider}.
 *
 * @param props - Shell children.
 * @returns The rendered marketing chrome.
 * @example
 * <MarketingShell><main>…</main></MarketingShell>
 */
export const MarketingShell = ({ children }: MarketingShellProps) => (
  <ThemeProvider>
    <MarketingChrome>{children}</MarketingChrome>
  </ThemeProvider>
);
