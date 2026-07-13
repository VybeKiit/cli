'use client';

import { EmbedPreviewPage } from '@library/components/EmbedPreviewPage';
import type { CatalogEntry } from '@library/data/catalog';
import { loadPreviewModule } from '@library/lib/loadPreview.client';

interface GenericEmbedPreviewProps {
  readonly entry: CatalogEntry | null;
  readonly previewKey: string;
}

/**
 * Client wrapper binding the generic catalog preview loader to a server-resolved catalog entry.
 *
 * Co-located with its route (not in `src/components`) so the generated `loadPreview.client` module —
 * which statically `import()`s every demo — stays out of the app typecheck program.
 *
 * @param props - The resolved catalog entry and its preview key.
 * @returns The embed preview bound to the generic demo loader.
 * @example
 * const element = <GenericEmbedPreview entry={entry} previewKey="kokonutui/card-flip" />;
 */
export const GenericEmbedPreview = ({ entry, previewKey }: GenericEmbedPreviewProps) => (
  <EmbedPreviewPage entry={entry} loadPreviewModule={loadPreviewModule} previewKey={previewKey} />
);
