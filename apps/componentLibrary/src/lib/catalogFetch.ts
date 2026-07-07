import type { CatalogCategory, CatalogEntry } from '@library/data/catalog';

export interface CatalogIndexPayload {
  readonly categories: CatalogCategory[];
  readonly namespaces: string[];
  readonly count: number;
  readonly componentCount: number;
  readonly exampleCount: number;
}

interface CatalogShardPayload {
  readonly entries: CatalogEntry[];
}

interface CatalogFullPayload extends CatalogIndexPayload {
  readonly entries: CatalogEntry[];
}

const indexCache: { payload?: CatalogIndexPayload; promise?: Promise<CatalogIndexPayload> } = {};
const fullCache: { payload?: CatalogFullPayload; promise?: Promise<CatalogFullPayload> } = {};
const shardCache = new Map<string, Promise<CatalogShardPayload>>();

const readJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`${url} ${response.status}`);
  }
  return response.json() as Promise<T>;
};

/**
 * Fetch catalog index data for the component library.
 *
 * @returns The loaded value produced by fetchCatalogIndex.
 * @example
 * const result = await fetchCatalogIndex();
 */
export const fetchCatalogIndex = (): Promise<CatalogIndexPayload> => {
  if (indexCache.payload) {
    return Promise.resolve(indexCache.payload);
  }
  if (!indexCache.promise) {
    indexCache.promise = readJson<CatalogIndexPayload>('/catalog/index.json').then((payload) => {
      indexCache.payload = payload;
      return payload;
    });
  }
  return indexCache.promise;
};

/**
 * Fetch full catalog data for the component library.
 *
 * @returns The loaded value produced by fetchFullCatalog.
 * @example
 * const result = await fetchFullCatalog();
 */
export const fetchFullCatalog = (): Promise<CatalogFullPayload> => {
  if (fullCache.payload) {
    return Promise.resolve(fullCache.payload);
  }
  if (!fullCache.promise) {
    fullCache.promise = readJson<CatalogFullPayload>('/catalog.json').then((payload) => {
      fullCache.payload = payload;
      return payload;
    });
  }
  return fullCache.promise;
};

/**
 * Fetch category shard data for the component library.
 *
 * @param category - Catalog category slug to load or persist.
 * @returns The loaded value produced by fetchCategoryShard.
 * @example
 * const result = await fetchCategoryShard('buttons');
 */
export const fetchCategoryShard = (category: string): Promise<CatalogShardPayload> => {
  const cached = shardCache.get(category);
  if (cached) {
    return cached;
  }

  const promise = readJson<CatalogShardPayload>(`/catalog/shards/${category}.json`).catch(() =>
    fetchFullCatalog().then((full) => ({
      entries: full.entries.filter((entry) => entry.category === category),
    })),
  );

  shardCache.set(category, promise);
  return promise;
};

/**
 * Prefetch category shard.
 *
 * @param category - Catalog category slug to load or persist.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * prefetchCategoryShard('buttons');
 */
export const prefetchCategoryShard = (category: string): void => {
  if (category === 'all') {
    return;
  }
  void fetchCategoryShard(category);
};

/**
 * Register catalog entries.
 *
 * @param entries - Catalog entries to render or describe.
 * @returns The value produced by registerCatalogEntries.
 * @example
 * const result = registerCatalogEntries(entries);
 */
export const registerCatalogEntries = (
  entries: readonly CatalogEntry[],
): Record<string, CatalogEntry> => {
  const patch: Record<string, CatalogEntry> = {};
  for (const entry of entries) {
    patch[entry.previewKey] = entry;
  }
  return patch;
};
