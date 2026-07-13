import { CATALOG_BY_KEY } from '@library/data/catalog';
import { GenericEmbedPreview } from './GenericEmbedPreview';

interface GenericEmbedPreviewRouteProps {
  readonly params: Promise<{
    readonly namespace: string;
    readonly name: string;
  }>;
}

/**
 * Render a chrome-less catalog component preview for iframe embedding.
 *
 * The single catalog entry is resolved here on the server so the 849 KB catalog stays out of the
 * embed client chunk.
 *
 * @param props - Route params supplied by Next.js.
 * @returns The generic embed preview for the requested catalog entry.
 * @example
 * const element = await GenericEmbedPreviewRoute({ params });
 */
const GenericEmbedPreviewRoute = async ({ params }: GenericEmbedPreviewRouteProps) => {
  const { namespace, name } = await params;
  const previewKey = `${namespace}/${decodeURIComponent(name)}`;

  return <GenericEmbedPreview entry={CATALOG_BY_KEY[previewKey] ?? null} previewKey={previewKey} />;
};

export default GenericEmbedPreviewRoute;
