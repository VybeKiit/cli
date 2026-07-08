import { CATALOG_CATEGORIES } from '@library/data/catalog.meta';

const LABELS = Object.fromEntries(CATALOG_CATEGORIES.map((item) => [item.slug, item.label]));

/**
 * Category label from slug.
 *
 * @param slug - Catalog slug to display.
 * @returns The value produced by categoryLabelFromSlug.
 * @example
 * const result = categoryLabelFromSlug('marketing');
 */
export const categoryLabelFromSlug = (slug: string): string => {
  const label = LABELS[slug];
  if (label === undefined) {
    return slug;
  }
  return label;
};
