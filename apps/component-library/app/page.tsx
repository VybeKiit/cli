import { CatalogBrowser } from '@library/components/CatalogBrowser';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground text-sm">Loading catalog…</div>}>
      <CatalogBrowser />
    </Suspense>
  );
}
