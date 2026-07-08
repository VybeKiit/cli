import type { MetadataRoute } from 'next';
import { BRAND } from '@/data/site';

/**
 * Robots policy: let every crawler in, point them at the sitemap, and keep the
 * transactional and API routes out of the index. Resolved against the canonical
 * origin (SSOT: `BRAND.url`).
 *
 * @returns The generated `/robots.txt` rules.
 */
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/checkout', '/success', '/cancel', '/api/'],
  },
  sitemap: `${BRAND.url}/sitemap.xml`,
  host: BRAND.url,
});

export default robots;
