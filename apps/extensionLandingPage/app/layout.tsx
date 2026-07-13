import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRAND, HERO } from '@/data/landingContent';
import './globals.css';

export const metadata: Metadata = {
  title: `${BRAND.name} — Supercharge your browser`,
  description: HERO.subhead,
  applicationName: BRAND.name,
};

/**
 * Root layout for the extension landing page.
 *
 * Static marketing page — English/LTR so it can be statically generated. Ships
 * the global token layer and renders the page tree; interactive behavior lives
 * on the client leaves (nav toggle, counters, switches, accordion).
 *
 * @param props - The rendered page tree.
 * @returns The html document shell.
 * @example
 * // Rendered by Next.js as the app root layout.
 */
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html dir="ltr" lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
