import { getCms } from '@/lib/providers';
import { getSeo } from '@/lib/seo';

/**
 * Generate llms.txt for AI crawlers and answer engines.
 *
 * @returns Text response containing public pages and CMS pages.
 * @example
 * const response = await GET();
 */
export const GET = async () => {
  const cms = getCms();
  const cmsPages = await cms.listPages();
  const seo = getSeo();

  const body = seo.buildLlmsTxt({
    siteName: 'My App',
    siteDescription:
      'Public pages and blog posts for this product. Structured for search and AI answer engines.',
    pages: [
      { path: '/', title: 'Home', summary: 'Product overview' },
      { path: '/pricing', title: 'Pricing', summary: 'Plans and checkout' },
      { path: '/blog', title: 'Blog', summary: 'Updates and articles' },
      ...cmsPages.map((page) => ({
        path: `/blog/${page.slug}`,
        title: page.title,
        summary: page.description,
      })),
    ],
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
