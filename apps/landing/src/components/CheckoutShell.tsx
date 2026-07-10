import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/MarketingShell';

interface CheckoutShellProps {
  readonly children: ReactNode;
  /**
   * @deprecated Ignored — store pages share the same SiteHeader as the homepage.
   * Kept so partner/doc call sites keep compiling until fully migrated.
   */
  readonly headerBrand?: ReactNode;
  /**
   * @deprecated Ignored — checkout CTA lives in SiteHeader.
   */
  readonly showCheckout?: boolean;
}

/**
 * Store-page shell that matches the visitor landing chrome
 * (theme, header, footer, visitor-light tokens).
 *
 * @param props - Page body children.
 * @returns The rendered marketing shell around the page.
 * @example
 * <CheckoutShell><CheckoutForm /></CheckoutShell>
 */
export const CheckoutShell = ({ children }: CheckoutShellProps) => (
  <MarketingShell>{children}</MarketingShell>
);
