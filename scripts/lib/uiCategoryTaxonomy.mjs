import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFrom } from './repoRoot.mjs';

const TAXONOMY_PATH = join(repoRootFrom(import.meta.url), 'scripts/data/ui-category-taxonomy.json');

/** @type {{ categories: Array<{ slug: string, label: string, order: number }>, keywords: Record<string, string[]>, namespaceHints: Record<string, string> }} */
const taxonomy = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));

const CATEGORY_ORDER = Object.fromEntries(
  taxonomy.categories.map((category) => [category.slug, category.order]),
);

const CATEGORY_LABELS = Object.fromEntries(
  taxonomy.categories.map((category) => [category.slug, category.label]),
);

/** Slugs sorted for sidebar display (excludes nothing — caller filters empty). */
export const TAXONOMY_SLUGS = [...taxonomy.categories]
  .sort((a, b) => a.order - b.order)
  .map((category) => category.slug);

/**
 * @param {string} slug
 */
export function categoryLabel(slug) {
  return CATEGORY_LABELS[slug] ?? slug;
}

/**
 * @param {string} slug
 */
export function categoryOrder(slug) {
  return CATEGORY_ORDER[slug] ?? 50;
}

/**
 * Classify a mirrored block into a functional sub-category.
 * Name/title wins over tags — upstream tag hints like "hero" on cards are too noisy alone.
 * @param {string} name
 * @param {Record<string, unknown>} [item]
 * @param {string[]} [tags]
 * @param {string} [namespace]
 * @param {string} [registryCategory] upstream category when present
 */
export function inferCategory(name, item = {}, tags = [], namespace = '', registryCategory = '') {
  const forced = String(item.category ?? registryCategory ?? '').toLowerCase();
  if (forced && forced !== 'component' && CATEGORY_LABELS[forced]) {
    return forced;
  }

  const nameHaystack = `${name} ${item.title ?? ''}`.toLowerCase();
  const tagHaystack = tags.join(' ').toLowerCase();

  const matchKeywords = (haystack) => {
    for (const [slug, keywords] of Object.entries(taxonomy.keywords)) {
      if (keywords.some((keyword) => haystack.includes(keyword))) {
        return slug;
      }
    }
    return null;
  };

  const fromName = matchKeywords(nameHaystack);
  if (fromName) {
    return fromName;
  }

  if (namespace === 'ai-elements') {
    return 'ai';
  }

  const fromTags = matchKeywords(tagHaystack);
  if (fromTags && fromTags !== 'hero') {
    return fromTags;
  }

  if (namespace && taxonomy.namespaceHints[namespace]) {
    return taxonomy.namespaceHints[namespace];
  }

  const upstream = String(registryCategory ?? item.category ?? '').toLowerCase();
  if (upstream && upstream !== 'component' && CATEGORY_LABELS[upstream]) {
    return upstream;
  }

  if (fromTags) {
    return fromTags;
  }

  return 'component';
}

export { taxonomy as UI_CATEGORY_TAXONOMY };
