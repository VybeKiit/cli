'use client';

import { EmbedPreviewPage } from '@library/components/EmbedPreviewPage';
import type { CatalogEntry } from '@library/data/catalog';
import { loadVybeKiitDemo } from '@library/lib/loadPreview.demo.vybekiit';

interface VybeKiitEmbedPreviewProps {
  readonly entry: CatalogEntry | null;
  readonly previewKey: string;
}

/**
 * Client wrapper binding the VybeKiit mascot demo loader to a server-resolved catalog entry.
 *
 * Co-located with its route (not in `src/components`) to mirror the generic embed wrapper and keep
 * the client-only preview loaders out of the app typecheck program.
 *
 * @param props - The resolved catalog entry and its preview key.
 * @returns The embed preview bound to the VybeKiit demo loader.
 * @example
 * const element = <VybeKiitEmbedPreview entry={entry} previewKey="vybekiit/claude-octopus-wave" />;
 */
export const VybeKiitEmbedPreview = ({ entry, previewKey }: VybeKiitEmbedPreviewProps) => (
  <EmbedPreviewPage
    entry={entry}
    loadPreviewModule={(candidate) => loadVybeKiitDemo(candidate.name)}
    previewKey={previewKey}
  />
);
