import type { MetadataRoute } from 'next';
import { BRAND } from '@/data/site';

/** Paths kept out of all crawler indexes (transactional + API). */
const DISALLOW_PATHS: readonly string[] = ['/checkout', '/success', '/cancel', '/api/'];

/**
 * Explicit AI search / answer crawlers — allow public marketing content.
 * Training-only bots are also allowed on this marketing site to maximize citation
 * eligibility; sensitive paths stay disallowed for every agent below.
 */
const AI_SEARCH_USER_AGENTS: readonly string[] = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'cohere-ai',
  'meta-externalagent',
];

/**
 * Robots policy: allow major AI + classic crawlers on public pages, point them at
 * the sitemap, and keep transactional/API routes out of the index.
 *
 * @returns The generated `/robots.txt` rules.
 */
const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOW_PATHS],
    },
    ...AI_SEARCH_USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow: [...DISALLOW_PATHS],
    })),
  ],
  sitemap: `${BRAND.url}/sitemap.xml`,
  host: BRAND.url,
});

export default robots;
