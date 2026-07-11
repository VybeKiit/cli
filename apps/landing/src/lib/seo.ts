/**
 * Landing SEO helpers bound to the canonical brand origin.
 */
import { createSeoFromEnv } from '@vybekiit/content';
import { ALL_DISCOVERABILITY_PAGES } from '@/data/discoverability/catalog';
import { BRAND } from '@/data/site';

/**
 * Create the SEO service for the landing site (APP_URL = brand origin).
 *
 * @returns Configured SEO provider.
 * @example
 * const seo = getLandingSeo();
 * seo.buildLlmsTxt({ siteName: 'VybeKiit', siteDescription: '...', pages: [] });
 */
export const getLandingSeo = () =>
  createSeoFromEnv({
    APP_URL: BRAND.url,
    NODE_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });

/**
 * Page list for llms.txt (catalog SSOT).
 *
 * @returns LlmsTxt page entries.
 * @example
 * getLandingLlmsPages().length > 0
 */
export const getLandingLlmsPages = () =>
  ALL_DISCOVERABILITY_PAGES.map((page) => ({
    path: page.path,
    title: page.title,
    summary: page.summary,
  }));
