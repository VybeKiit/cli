import { Providers } from '@library/components/Providers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

/** SEO metadata for the component library app. */
export const metadata: Metadata = {
  title: 'VybeKiit UI Library',
  description:
    'Browse 640+ mirrored shadcn-compatible components — AI Elements, Kibo UI, Magic UI, BundUI, and more.',
  metadataBase: new URL('https://ui.vybekiit.com'),
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

/**
 * Renders the component library root document.
 *
 * @param props - Root layout props.
 * @returns The root HTML shell.
 * @example
 * <RootLayout>Page</RootLayout>
 */
const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning={true}>
    <body className="ui-library-page antialiased" suppressHydrationWarning={true}>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
