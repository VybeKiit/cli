import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { APP_NAME } from '@/data/landingContent';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} — Everything you need, all in one app`,
  description:
    'Simplify your day, stay organized, and focus on what matters. Download AppName and experience the difference.',
  applicationName: APP_NAME,
};

/**
 * Root layout for the mobile-app landing page.
 *
 * Minimal by design — English/LTR so the marketing page statically generates, with
 * only global tokens loaded. No dev shells, JSON-LD, or third-party widgets.
 *
 * @param props - The layout children (the routed page).
 * @returns The rendered HTML document shell.
 * @example
 * // Next.js renders this automatically around every route.
 */
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html dir="ltr" lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
