import { BRAND } from '@/data/site';
import { getLandingLlmsPages, getLandingSeo } from '@/lib/seo';

/**
 * Generate `/llms.txt` for AI crawlers, answer engines, and coding agents.
 *
 * @returns Plain-text Markdown index of public pages.
 * @example
 * const response = await GET();
 */
export const GET = async () => {
  const seo = getLandingSeo();
  const body = seo.buildLlmsTxt({
    siteName: BRAND.name,
    siteDescription: BRAND.description,
    pages: getLandingLlmsPages(),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
