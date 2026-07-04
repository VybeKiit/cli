import { CatalogBrowser } from '@library/components/CatalogBrowser';
import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingSpinner';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <Suspense fallback={<PreviewLoadingOverlay className="min-h-screen p-8" />}>
      <CatalogBrowser />
    </Suspense>
  );
}
