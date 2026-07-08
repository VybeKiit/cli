import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { SaasPageView } from '@/components/saas-page-view';
import { getDashboardSaasPage } from '@/data/saasPages';

interface DashboardPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

/**
 * Render the signed-in dashboard home.
 *
 * @param props - Locale route params from Next.js.
 * @returns The dashboard overview page.
 * @example
 * <DashboardPage params={params} />
 */
const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const definition = getDashboardSaasPage('dashboard');
  if (definition === undefined) {
    notFound();
  }

  return <SaasPageView definition={definition} surface="dashboard" />;
};

export default DashboardPage;
