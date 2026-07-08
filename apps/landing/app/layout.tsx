import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { ReportModeDevShell } from '@/components/report-mode/ReportModeShell';
import { AssistantChatDevShell } from '@/components/tools/assistant-chat/AssistantChatShell';
import { BRAND, SEO_KEYWORDS } from '@/data/site';
import { organizationJsonLd, websiteJsonLd } from '@/data/structuredData';
import { resolveDirection } from '@/lib/direction';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [...SEO_KEYWORDS],
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: BRAND.url }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: 'technology',
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: BRAND.url,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  icons: {
    icon: '/vybekiit-logo.svg',
    shortcut: '/vybekiit-logo.svg',
    apple: '/vybekiit-logo.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout for the store. Detects the visitor's language from the request and
 * sets `<html dir>` so RTL locales (Hebrew/Arabic) mirror automatically — see
 * `src/lib/direction.ts`. Copy stays English; the structure is RTL-safe.
 */
const RootLayout = async ({ children }: { children: ReactNode }) => {
  const { lang, dir } = resolveDirection((await headers()).get('accept-language'));
  return (
    <html lang={lang} dir={dir}>
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        {children}
        <ReportModeDevShell />
        <AssistantChatDevShell />
      </body>
    </html>
  );
};

export default RootLayout;
