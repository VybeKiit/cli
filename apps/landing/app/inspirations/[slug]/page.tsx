import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INSPIRATION_LAYOUTS } from '@/components/inspirations/layout-registry';
import { getInspirationBySlug, INSPIRATION_DIRECTIONS } from '@/data/inspirations';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = () => INSPIRATION_DIRECTIONS.map((d) => ({ slug: d.slug }));

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const direction = getInspirationBySlug(slug);
  if (!direction) {
    return { title: 'Not found' };
  }
  return {
    title: `VybeKiit inspiration — ${direction.name}`,
    description: direction.vibe,
  };
};

/** Full-page preview for one landing vibe direction. */
const InspirationPreviewPage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const direction = getInspirationBySlug(slug);
  if (!direction) {
    notFound();
  }

  const Layout = INSPIRATION_LAYOUTS[slug];
  if (!Layout) {
    notFound();
  }

  return <Layout direction={direction} />;
};

export default InspirationPreviewPage;
