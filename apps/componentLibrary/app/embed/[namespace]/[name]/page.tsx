'use client';

import { EmbedPreviewPage } from '@library/components/EmbedPreviewPage';
import { loadPreviewModule } from '@library/lib/loadPreview.client';
import { useParams } from 'next/navigation';

const GenericEmbedPreviewRoute = () => {
  const params = useParams<{ namespace: string; name: string }>();
  const previewKey = `${params.namespace}/${decodeURIComponent(params.name)}`;

  return <EmbedPreviewPage loadPreviewModule={loadPreviewModule} previewKey={previewKey} />;
};

export default GenericEmbedPreviewRoute;
