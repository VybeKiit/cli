import { getSeo } from '@/lib/seo';

// extracts the URL from "Sitemap: https://example.com/sitemap.xml"
const SITEMAP_LINE_PATTERN = /Sitemap:\s*(.+)/;

/**
 * Build the robots.txt response from the SEO provider.
 *
 * @returns Robots rules and optional sitemap URL for Next.js.
 * @example
 * const rules = robots();
 */
const robots = () => {
  const seo = getSeo();
  const body = seo.robotsTxt();
  const sitemapMatch = body.match(SITEMAP_LINE_PATTERN);
  const sitemapValue = sitemapMatch === null ? undefined : sitemapMatch[1];
  const sitemap =
    sitemapValue === undefined || sitemapValue === '' ? undefined : sitemapValue.trim();
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(sitemap ? { sitemap } : {}),
  };
};

export default robots;
