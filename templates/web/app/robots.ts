import { getSeo } from '@/lib/seo';

export default function robots() {
  const seo = getSeo();
  const body = seo.robotsTxt();
  const sitemapMatch = body.match(/Sitemap:\s*(.+)/);
  const sitemap = sitemapMatch?.[1]?.trim();
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(sitemap ? { sitemap } : {}),
  };
}
