'use client';

import { EmbedPreviewPage } from '@library/components/EmbedPreviewPage';
import { loadVybeKiitDemo } from '@library/lib/loadPreview.demo.vybekiit';
import { useParams } from 'next/navigation';

export default function VybeKiitEmbedPreviewRoute() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const previewKey = `vybekiit/${name}`;

  return (
    <EmbedPreviewPage
      loadPreviewModule={(entry) => loadVybeKiitDemo(entry.name)}
      previewKey={previewKey}
    />
  );
}
