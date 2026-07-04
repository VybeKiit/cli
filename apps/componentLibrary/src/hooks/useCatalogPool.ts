'use client';

import { useRegisterCatalogEntries } from '@library/context/CatalogDataContext';
import type { CatalogEntry } from '@library/data/catalog';
import { fetchCategoryShard, fetchFullCatalog } from '@library/lib/catalogFetch';
import { useEffect, useState } from 'react';

/** Load the smallest catalog slice needed for the active filters. */
export function useCatalogPool(
  category: string,
  query: string,
  ready: boolean,
): { readonly pool: CatalogEntry[]; readonly poolReady: boolean } {
  const registerEntries = useRegisterCatalogEntries();
  const [pool, setPool] = useState<CatalogEntry[]>([]);
  const [poolReady, setPoolReady] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;
    setPoolReady(false);

    const trimmedQuery = query.trim();
    const needsFullCatalog = category === 'all' || trimmedQuery.length > 0;

    const loader = needsFullCatalog
      ? fetchFullCatalog().then((payload) => payload.entries)
      : fetchCategoryShard(category).then((payload) => payload.entries);

    void loader
      .then((entries) => {
        if (cancelled) {
          return;
        }
        registerEntries(entries);
        setPool(entries);
        setPoolReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setPool([]);
          setPoolReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, query, ready, registerEntries]);

  return { pool, poolReady };
}
