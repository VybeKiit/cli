import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckoutShell } from '@/components/CheckoutShell';
import { GeoArticle } from '@/components/discoverability/GeoArticle';
import { COMPARE_VS_SLUGS } from '@/data/discoverability/catalog';
import { findCompareVsPage } from '@/data/discoverability/geoPages';
import { BRAND } from '@/data/site';

interface CompareVsPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

/**
 * Static params for head-to-head vs pages.
 *
 * @returns Slug list for generateStaticParams.
 */
export const generateStaticParams = () => COMPARE_VS_SLUGS.map((slug) => ({ slug }));

/**
 * Metadata for a vs page.
 *
 * @param props - Dynamic route params.
 * @returns Next metadata or empty object when missing.
 */
export const generateMetadata = async ({ params }: CompareVsPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const page = findCompareVsPage(slug);
  if (page === undefined) {
    return {};
  }
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.path },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `${BRAND.url}${page.path}`,
    },
  };
};

/**
 * Head-to-head comparison spoke under /compare.
 *
 * @param props - Route params.
 * @returns Rendered article or 404.
 */
const CompareVsPage = async ({ params }: CompareVsPageProps) => {
  const { slug } = await params;
  const page = findCompareVsPage(slug);
  if (page === undefined) {
    notFound();
  }

  return (
    <CheckoutShell>
      <GeoArticle page={page} />
    </CheckoutShell>
  );
};

export default CompareVsPage;
