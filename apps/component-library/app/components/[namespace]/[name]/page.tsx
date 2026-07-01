import { ComponentDetail } from '@library/components/PreviewFrame';
import { CATALOG_ENTRIES } from '@library/data/catalog';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ namespace: string; name: string }>;
}

export default async function ComponentPage({ params }: PageProps) {
  const { namespace, name } = await params;
  const decoded = decodeURIComponent(name);
  const entry = CATALOG_ENTRIES.find((e) => e.namespace === namespace && e.name === decoded);

  if (!entry) {
    notFound();
  }

  return <ComponentDetail entry={entry} />;
}
