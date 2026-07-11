import type { MetadataRoute } from 'next';
import { ALL_DISCOVERABILITY_PAGES } from '@/data/discoverability/catalog';
import { BRAND } from '@/data/site';

/**
 * Build the sitemap from the discoverability catalog (SSOT for SEO/GEO URLs).
 *
 * @returns The sitemap entries for `/sitemap.xml`.
 */
const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = new Date('2026-07-11');
  return ALL_DISCOVERABILITY_PAGES.map((page) => ({
    url: page.path === '/' ? BRAND.url : `${BRAND.url}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
};

export default sitemap;
