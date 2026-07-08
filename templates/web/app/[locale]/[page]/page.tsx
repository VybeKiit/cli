import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SaasPageView } from '@/components/saas-page-view';
import { getPublicSaasPage, PUBLIC_SAAS_PAGES } from '@/data/saasPages';

interface PublicSaasRoutePageProps {
  readonly params: Promise<{
    readonly locale: string;
    readonly page: string;
  }>;
}

/**
 * Generate static params for public SaaS template routes.
 *
 * @returns Static route params for every public SaaS page.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => PUBLIC_SAAS_PAGES.map(({ slug }) => ({ page: slug }));

/**
 * Render a public buyer-ready SaaS route.
 *
 * @param props - Locale and page route params from Next.js.
 * @returns The matching public SaaS page, or a Next.js not-found response for unknown slugs.
 * @example
 * <PublicSaasRoutePage params={params} />
 */
const PublicSaasRoutePage = async ({ params }: PublicSaasRoutePageProps) => {
  const { locale, page } = await params;
  setRequestLocale(locale);
  await getTranslations();

  const definition = getPublicSaasPage(page);
  if (definition === undefined) {
    notFound();
  }

  return <SaasPageView definition={definition} />;
};

export default PublicSaasRoutePage;
