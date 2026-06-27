import { resolveDirection } from '@/lib/direction';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'My VybeKiit App',
  description: 'Built with VybeKiit.',
};

/**
 * Root layout. Detects the visitor's language from the request and sets
 * `<html dir>` so RTL locales (Hebrew/Arabic) mirror automatically — see
 * `src/lib/direction.ts`.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { lang, dir } = resolveDirection((await headers()).get('accept-language'));
  return (
    <html lang={lang} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
