import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@library/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'VybeKiit UI Library',
  description:
    'Browse 640+ mirrored shadcn-compatible components — AI Elements, Kibo UI, Magic UI, BundUI, and more.',
  metadataBase: new URL('https://ui.vybekiit.com'),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="ui-library-page antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
