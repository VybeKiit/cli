import type { CatalogCategory, CatalogEntry } from '@library/data/catalog';
import { CATALOG_CATEGORIES } from '@library/data/catalog.meta';

/**
 * Group catalog entries.
 *
 * @param entries - Catalog entries to render or describe.
 * @param categoryFilter - Selected category slug, or all for the complete catalog.
 * @param categories - Ordered category metadata used to group entries.
 * @returns The value produced by groupCatalogEntries.
 * @example
 * const result = groupCatalogEntries(entries, 'all', categories);
 */
export const groupCatalogEntries = (
  entries: CatalogEntry[],
  categoryFilter: string,
  categories: readonly CatalogCategory[] = CATALOG_CATEGORIES,
): Array<{ slug: string; entries: CatalogEntry[] }> => {
  if (categoryFilter !== 'all') {
    return [{ slug: categoryFilter, entries }];
  }

  const order = categories.map((item) => item.slug);
  const buckets = new Map<string, CatalogEntry[]>();

  for (const entry of entries) {
    let list = buckets.get(entry.category);
    if (list === undefined) {
      list = [];
      buckets.set(entry.category, list);
    }
    list.push(entry);
  }

  return order
    .filter((slug) => buckets.has(slug))
    .map((slug) => {
      const bucket = buckets.get(slug);
      if (bucket === undefined) {
        throw new Error(`Catalog category ${slug} was marked non-empty without a bucket.`);
      }
      return { slug, entries: bucket };
    });
};
