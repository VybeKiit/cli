import { getCms } from '@/lib/cms-client';
import { getSeo } from '@/lib/seo';

const STATIC_PATHS = ['/', '/pricing', '/checkout', '/blog'];

export default async function sitemap() {
  const seo = getSeo();
  const cms = getCms();
  const cmsPages = await cms.listPages();
  const paths = [...STATIC_PATHS, ...cmsPages.map((page) => `/blog/${page.slug}`)];
  const entries = seo.sitemapEntries(paths);
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified ?? new Date(),
  }));
}
