import { CatalogBrowser } from '@library/components/CatalogBrowser';
import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingSpinner';
import { Suspense } from 'react';

const HomePage = () => (
  <Suspense fallback={<PreviewLoadingOverlay className="min-h-screen p-8" />}>
    <CatalogBrowser />
  </Suspense>
);

export default HomePage;
