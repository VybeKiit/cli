import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getFeaturePage } from '@/components/saas/featurePages';
import { SaasPageView } from '@/components/saas-page-view';
import { FEATURE_PAGE_SLUGS, isFeaturePageSlug } from '@/data/featurePageSlugs';
import { DASHBOARD_SAAS_PAGES } from '@/data/dashboardSaasPages';
import { getDashboardSaasPage } from '@/data/saasPages';

interface DashboardSaasRoutePageProps {
  readonly params: Promise<{
    readonly locale: string;
    readonly page: string;
  }>;
}

/**
 * Generate static params for signed-in dashboard SaaS routes.
 *
 * @returns Static route params for feature pages and shell maps (excluding bare /dashboard).
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => {
  const shellSlugs = DASHBOARD_SAAS_PAGES.map(({ slug }) => slug);
  const featureSlugs = FEATURE_PAGE_SLUGS.filter(
    (slug) => slug !== 'dashboard',
  ) as readonly string[];
  return [...new Set([...featureSlugs, ...shellSlugs])].map((slug) => ({ page: slug }));
};

/**
 * Render a signed-in buyer-ready SaaS route.
 * Tier-1 surfaces use interactive feature pages; remaining routes keep shell maps.
 *
 * @param props - Locale and dashboard page route params from Next.js.
 * @returns The matching dashboard page, or a Next.js not-found response for unknown slugs.
 * @example
 * <DashboardSaasRoutePage params={params} />
 */
const DashboardSaasRoutePage = async ({ params }: DashboardSaasRoutePageProps) => {
  const { locale, page } = await params;
  setRequestLocale(locale);

  if (isFeaturePageSlug(page)) {
    const FeaturePage = getFeaturePage(page);
    if (FeaturePage === undefined) {
      notFound();
    }
    return <FeaturePage />;
  }

  const definition = getDashboardSaasPage(page);
  if (definition === undefined) {
    notFound();
  }

  return <SaasPageView definition={definition} surface="dashboard" />;
};

export default DashboardSaasRoutePage;
