import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND, FOOTER_LINKS } from '@/data/site';

/** Minimal shell for checkout and legal pages — keeps shadcn tokens, no cinematic chrome. */
export const CheckoutShell = ({
  children,
  headerBrand,
  showCheckout = true,
}: {
  children: ReactNode;
  /** Custom header brand slot; defaults to the plain VybeKiit wordmark link. */
  headerBrand?: ReactNode;
  /** Whether to show the Checkout link — off for partner/doc pages that aren't a buy flow. */
  showCheckout?: boolean;
}) => {
  const renderedHeaderBrand =
    headerBrand === undefined ? (
      <Link className="font-semibold tracking-tight" href="/">
        {BRAND.name}
      </Link>
    ) : (
      headerBrand
    );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          {renderedHeaderBrand}
          {showCheckout ? (
            <Link className="text-muted-foreground text-sm hover:text-foreground" href="/checkout">
              Checkout
            </Link>
          ) : null}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 text-muted-foreground text-sm">
          <p>© 2026 {BRAND.name}. All rights reserved.</p>
          <nav aria-label="Legal" className="flex gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link className="hover:text-foreground" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};
