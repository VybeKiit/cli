import { ClientStateProvider } from '@/lib/client-state';
import { Toaster } from '@/components/ui/sonner';
import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';
import { routing } from '@/i18n/routing';
import { localeToDirection, localeToLang } from '@/lib/direction';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import '../globals.css';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: '' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

/**
 * Locale layout — sets `<html lang dir>` from the active i18n locale and provides
 * translated messages to client components.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
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
        <NextIntlClientProvider messages={messages}>
          <ClientStateProvider>
            {children}
            <Toaster />
            <ReportModeDevShell />
          </ClientStateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
