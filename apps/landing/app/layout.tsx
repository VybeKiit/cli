import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { VisitorScripts } from '@/components/VisitorScripts';
import { BRAND, SEO_KEYWORDS } from '@/data/site';
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '@/data/structuredData';
import { cdnAssetUrl } from '@/lib/cdnAssets';
import { resolveDirection } from '@/lib/direction';
import './globals.css';

const brandLogoUrl = cdnAssetUrl('/vybekiit-logo.svg');

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
    icon: brandLogoUrl,
    shortcut: brandLogoUrl,
    apple: brandLogoUrl,
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
  other: {
    // Hint for tools that look for AI documentation maps (also served at /llms.txt).
    'llms-txt': `${BRAND.url}/llms.txt`,
  },
};

/**
 * Root layout for the store.
 *
 * Direction defaults to English/LTR so the marketing site can be statically
 * generated (no per-request `headers()`). Copy is English; logical CSS keeps the
 * structure RTL-safe when we localize later. Dev-only report/assistant shells are
 * loaded only in development so production visitors never download that graph.
 */
const RootLayout = async ({ children }: { children: ReactNode }) => {
  const { lang, dir } = resolveDirection(null);
  const devShells =
    process.env.NODE_ENV === 'development'
      ? (await import('@/components/LandingDevShells')).LandingDevShells
      : null;
  const DevShells = devShells;

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <JsonLd data={[organizationJsonLd, websiteJsonLd, softwareApplicationJsonLd]} />
        <VisitorScripts />
        {children}
        {DevShells ? <DevShells /> : null}
      </body>
    </html>
  );
};

export default RootLayout;
