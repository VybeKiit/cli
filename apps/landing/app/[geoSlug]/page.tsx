import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckoutShell } from '@/components/CheckoutShell';
import { GeoArticle } from '@/components/discoverability/GeoArticle';
import { ROOT_GEO_SLUGS } from '@/data/discoverability/catalog';
import { findGeoPageByRootSlug } from '@/data/discoverability/geoPages';
import { BRAND } from '@/data/site';

interface GeoSlugPageProps {
  readonly params: Promise<{ readonly geoSlug: string }>;
}

/**
 * Static params for root-level alternative and wedge pages.
 * Static routes (privacy, brand, …) take precedence over this dynamic segment.
 *
 * @returns Slug list for generateStaticParams.
 */
export const generateStaticParams = () => ROOT_GEO_SLUGS.map((geoSlug) => ({ geoSlug }));

/**
 * Metadata for a root GEO page.
 *
 * @param props - Dynamic route params.
 * @returns Next metadata or empty object when missing.
 */
export const generateMetadata = async ({ params }: GeoSlugPageProps): Promise<Metadata> => {
  const { geoSlug } = await params;
  const page = findGeoPageByRootSlug(geoSlug);
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
 * Root-level GEO spoke (alternative or wedge cluster).
 *
 * @param props - Route params.
 * @returns Rendered article or 404.
 */
const GeoSlugPage = async ({ params }: GeoSlugPageProps) => {
  const { geoSlug } = await params;
  const page = findGeoPageByRootSlug(geoSlug);
  if (page === undefined) {
    notFound();
  }

  return (
    <CheckoutShell>
      <GeoArticle page={page} />
    </CheckoutShell>
  );
};

export default GeoSlugPage;
