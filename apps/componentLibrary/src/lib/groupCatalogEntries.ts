import type { CatalogCategory, CatalogEntry } from '@library/data/catalog';
import { CATALOG_CATEGORIES } from '@library/data/catalog.meta';

export function groupCatalogEntries(
  entries: CatalogEntry[],
  categoryFilter: string,
  categories: readonly CatalogCategory[] = CATALOG_CATEGORIES,
): Array<{ slug: string; entries: CatalogEntry[] }> {
  if (categoryFilter !== 'all') {
    return [{ slug: categoryFilter, entries }];
  }

  const order = categories.map((item) => item.slug);
  const buckets = new Map<string, CatalogEntry[]>();

  for (const entry of entries) {
    const list = buckets.get(entry.category) ?? [];
    list.push(entry);
    buckets.set(entry.category, list);
  }

  return order
    .filter((slug) => buckets.has(slug))
    .map((slug) => ({ slug, entries: buckets.get(slug) ?? [] }));
}
