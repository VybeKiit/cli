import type { CatalogEntry } from '@library/data/catalog';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';

const searchCache = new WeakMap<CatalogEntry, string>();

const entrySearchText = (entry: CatalogEntry): string => {
  const cached = searchCache.get(entry);
  if (cached) {
    return cached;
  }
  const text = [
    entry.name,
    entry.namespace,
    entry.category,
    categoryLabelFromSlug(entry.category),
    ...entry.tags,
  ]
    .join(' ')
    .toLowerCase();
  searchCache.set(entry, text);
  return text;
};

/**
 * Matches catalog query.
 *
 * @param entry - Catalog entry to render or describe.
 * @param query - Search text entered by the user.
 * @returns The value produced by matchesCatalogQuery.
 * @example
 * const result = matchesCatalogQuery(entry, 'button');
 */
export const matchesCatalogQuery = (entry: CatalogEntry, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return entrySearchText(entry).includes(q);
};
