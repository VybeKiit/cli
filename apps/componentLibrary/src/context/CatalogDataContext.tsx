'use client';

import type { CatalogCategory, CatalogEntry } from '@library/data/catalog';
import {
  CATALOG_CATEGORIES,
  CATALOG_COMPONENT_COUNT,
  CATALOG_EXAMPLE_COUNT,
  CATALOG_NAMESPACES,
  COMPONENT_CATALOG_COUNT,
} from '@library/data/catalog.meta';
import {
  fetchCatalogIndex,
  fetchFullCatalog,
  registerCatalogEntries,
} from '@library/lib/catalogFetch';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface CatalogData {
  readonly entries: CatalogEntry[];
  readonly components: CatalogEntry[];
  readonly examples: CatalogEntry[];
  readonly byKey: Readonly<Record<string, CatalogEntry>>;
  readonly categories: CatalogCategory[];
  readonly namespaces: readonly string[];
  readonly count: number;
  readonly componentCount: number;
  readonly exampleCount: number;
}

interface CatalogDataContextValue {
  readonly catalog: CatalogData;
  readonly ready: boolean;
  readonly error: string | null;
  readonly registerEntries: (entries: readonly CatalogEntry[]) => void;
}

const CatalogDataContext = createContext<CatalogDataContextValue | null>(null);

function buildDerived(
  byKey: Readonly<Record<string, CatalogEntry>>,
): Pick<CatalogData, 'entries' | 'components' | 'examples'> {
  const entries = Object.values(byKey);
  const components: CatalogEntry[] = [];
  const examples: CatalogEntry[] = [];
  for (const entry of entries) {
    if (entry.kind === 'component') {
      components.push(entry);
    } else {
      examples.push(entry);
    }
  }
  return { entries, components, examples };
}

export function CatalogDataProvider({ children }: { readonly children: ReactNode }) {
  const [byKey, setByKey] = useState<Record<string, CatalogEntry>>({});
  const [categories, setCategories] = useState<CatalogCategory[]>(CATALOG_CATEGORIES);
  const [namespaces, setNamespaces] = useState<readonly string[]>(CATALOG_NAMESPACES);
  const [counts, setCounts] = useState({
    count: COMPONENT_CATALOG_COUNT,
    componentCount: CATALOG_COMPONENT_COUNT,
    exampleCount: CATALOG_EXAMPLE_COUNT,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerEntries = useCallback((entries: readonly CatalogEntry[]) => {
    if (entries.length === 0) {
      return;
    }
    setByKey((current) => ({ ...current, ...registerCatalogEntries(entries) }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchCatalogIndex()
      .then((index) => {
        if (cancelled) {
          return;
        }
        setCategories(index.categories);
        setNamespaces(index.namespaces);
        setCounts({
          count: index.count,
          componentCount: index.componentCount,
          exampleCount: index.exampleCount,
        });
        setReady(true);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load catalog index');
          setReady(true);
        }
      });

    void fetchFullCatalog()
      .then((full) => {
        if (!cancelled) {
          registerEntries(full.entries);
        }
      })
      .catch(() => {
        // Full catalog loads in background for selection tray — non-fatal.
      });

    return () => {
      cancelled = true;
    };
  }, [registerEntries]);

  const derived = useMemo(() => buildDerived(byKey), [byKey]);

  const catalog = useMemo(
    (): CatalogData => ({
      ...derived,
      byKey,
      categories,
      namespaces,
      count: counts.count,
      componentCount: counts.componentCount,
      exampleCount: counts.exampleCount,
    }),
    [byKey, categories, counts, derived, namespaces],
  );

  const value = useMemo(
    () => ({
      catalog,
      ready,
      error,
      registerEntries,
    }),
    [catalog, ready, error, registerEntries],
  );

  return <CatalogDataContext.Provider value={value}>{children}</CatalogDataContext.Provider>;
}

export function useCatalogData(): CatalogData {
  const ctx = useContext(CatalogDataContext);
  if (!ctx) {
    throw new Error('useCatalogData must be used within CatalogDataProvider');
  }
  return ctx.catalog;
}

export function useCatalogReady(): { readonly ready: boolean; readonly error: string | null } {
  const ctx = useContext(CatalogDataContext);
  if (!ctx) {
    throw new Error('useCatalogReady must be used within CatalogDataProvider');
  }
  return { ready: ctx.ready, error: ctx.error };
}

export function useRegisterCatalogEntries(): (entries: readonly CatalogEntry[]) => void {
  const ctx = useContext(CatalogDataContext);
  if (!ctx) {
    throw new Error('useRegisterCatalogEntries must be used within CatalogDataProvider');
  }
  return ctx.registerEntries;
}
