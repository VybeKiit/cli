import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { SaasPageView } from '@/components/saas-page-view';
import { DASHBOARD_SAAS_PAGES, getDashboardSaasPage } from '@/data/saasPages';

interface DashboardSaasRoutePageProps {
  readonly params: Promise<{
    readonly locale: string;
    readonly page: string;
  }>;
}

/**
 * Generate static params for signed-in dashboard SaaS routes.
 *
 * @returns Static route params for every dashboard SaaS page.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => DASHBOARD_SAAS_PAGES.map(({ slug }) => ({ page: slug }));

/**
 * Render a signed-in buyer-ready SaaS route.
 *
 * @param props - Locale and dashboard page route params from Next.js.
 * @returns The matching dashboard page, or a Next.js not-found response for unknown slugs.
 * @example
 * <DashboardSaasRoutePage params={params} />
 */
const DashboardSaasRoutePage = async ({ params }: DashboardSaasRoutePageProps) => {
  const { locale, page } = await params;
  setRequestLocale(locale);

  const definition = getDashboardSaasPage(page);
  if (definition === undefined) {
    notFound();
  }

  return <SaasPageView definition={definition} surface="dashboard" />;
};

export default DashboardSaasRoutePage;
