import { getCms } from '@/lib/providers';
import { getSeo } from '@/lib/seo';

/** llms.txt for AI crawlers and answer engines — skill: add-blog, go-live */
export async function GET() {
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
}
