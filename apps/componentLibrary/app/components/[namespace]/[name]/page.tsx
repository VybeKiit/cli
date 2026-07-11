import { ComponentDetail } from '@library/components/ComponentDetail';
import { CATALOG_ENTRIES } from '@library/data/catalog';
import { notFound } from 'next/navigation';

/** Component detail pages are always rendered on demand from the generated catalog. */
export const dynamic = 'force-dynamic';

interface PageProps {
  readonly params: Promise<{ readonly namespace: string; readonly name: string }>;
}

/**
 * Renders a component detail page for a catalog namespace/name pair.
 *
 * @param props - Route props from Next.js.
 * @returns The component detail page.
 * @example
 * const page = await ComponentPage({ params });
 */
const ComponentPage = async ({ params }: PageProps) => {
  const { namespace, name } = await params;
  const decoded = decodeURIComponent(name);
  const entry = CATALOG_ENTRIES.find((e) => e.namespace === namespace && e.name === decoded);

  if (!entry) {
    notFound();
  }

  return <ComponentDetail entry={entry} />;
};

export default ComponentPage;
