import { getCms } from '@/lib/providers';
import { getSeo } from '@/lib/seo';

const STATIC_PATHS = ['/', '/pricing', '/checkout', '/blog'];

/**
 * Build sitemap entries from static routes and CMS pages.
 *
 * @returns Sitemap entries consumed by Next.js.
 * @example
 * const entries = await sitemap();
 */
const sitemap = async () => {
  const seo = getSeo();
  const cms = getCms();
  const cmsPages = await cms.listPages();
  const paths = [...STATIC_PATHS, ...cmsPages.map((page) => `/blog/${page.slug}`)];
  const entries = seo.sitemapEntries(paths);
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified === undefined ? new Date() : entry.lastModified,
  }));
};

export default sitemap;
