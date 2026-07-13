import { CATALOG_BY_KEY } from '@library/data/catalog';
import { VybeKiitEmbedPreview } from './VybeKiitEmbedPreview';

interface VybeKiitEmbedPreviewRouteProps {
  readonly params: Promise<{
    readonly name: string;
  }>;
}

/**
 * Render a chrome-less VybeKiit mascot preview for iframe embedding.
 *
 * The single catalog entry is resolved here on the server so the 849 KB catalog stays out of the
 * embed client chunk.
 *
 * @param props - Route params supplied by Next.js.
 * @returns The VybeKiit embed preview for the requested mascot.
 * @example
 * const element = await VybeKiitEmbedPreviewRoute({ params });
 */
const VybeKiitEmbedPreviewRoute = async ({ params }: VybeKiitEmbedPreviewRouteProps) => {
  const { name } = await params;
  const previewKey = `vybekiit/${decodeURIComponent(name)}`;

  return (
    <VybeKiitEmbedPreview entry={CATALOG_BY_KEY[previewKey] ?? null} previewKey={previewKey} />
  );
};

export default VybeKiitEmbedPreviewRoute;
