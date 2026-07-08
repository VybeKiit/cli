import type { MetadataRoute } from 'next';
import { BRAND } from '@/data/site';

/**
 * Indexable routes for the sitemap — the marketing and legal pages. Transactional
 * routes (`/checkout`, `/success`, `/cancel`), the API, and the internal inspiration
 * variants are intentionally left out to avoid promoting thin or duplicate pages.
 */
const INDEXABLE_PATHS: readonly string[] = [
  '/',
  '/brand',
  '/inspirations',
  '/docs/supabase',
  '/privacy',
  '/terms',
];

/**
 * Build the sitemap, resolving every path against the canonical origin (SSOT: `BRAND.url`).
 *
 * @returns The sitemap entries for `/sitemap.xml`.
 */
const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = new Date();
  return INDEXABLE_PATHS.map((path) => ({
    url: path === '/' ? BRAND.url : `${BRAND.url}${path}`,
    lastModified,
  }));
};

export default sitemap;
