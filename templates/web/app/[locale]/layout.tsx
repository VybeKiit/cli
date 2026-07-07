import { ClientStateProvider } from '@/lib/client-state';
import { Toaster } from '@vybekiit/ui/sonner';
import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';
import { routing } from '@/i18n/routing';
import { localeToDirection, localeToLang } from '@/lib/direction';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';

interface LocaleLayoutProps {
  readonly children?: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

/**
 * Build static locale params for the App Router.
 *
 * @returns Locale params generated from the routing config.
 * @example
 * const params = generateStaticParams();
 */
const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/**
 * Build localized root metadata.
 *
 * @param props - Locale route params from Next.js.
 * @returns Metadata title and description for the locale.
 * @example
 * const metadata = await generateMetadata({ params });
 */
const generateMetadata = async ({ params }: { readonly params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: '' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
};

/**
 * Locale layout — sets `<html lang dir>` from the active i18n locale and provides
 * translated messages to client components.
 *
 * @param props - Optional route content plus locale params.
 * @returns Localized document shell for the app.
 * @example
 * <LocaleLayout params={params}><Page /></LocaleLayout>
 */
const LocaleLayout = async ({ children = null, params }: LocaleLayoutProps) => {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const lang = localeToLang(locale);
  const dir = localeToDirection(locale);

  return (
    <html lang={lang} dir={dir}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientStateProvider>
            {children}
            <Toaster />
            <ReportModeDevShell />
          </ClientStateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export { generateMetadata, generateStaticParams };
export default LocaleLayout;
