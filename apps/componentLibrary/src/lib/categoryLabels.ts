import { CATALOG_CATEGORIES } from '@library/data/catalog.meta';

const LABELS = Object.fromEntries(CATALOG_CATEGORIES.map((item) => [item.slug, item.label]));

export function categoryLabelFromSlug(slug: string): string {
  return LABELS[slug] ?? slug;
}
