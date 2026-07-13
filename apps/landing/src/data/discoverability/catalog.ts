/**
 * Discoverability catalog — every public SEO/GEO URL, title, and one-line summary.
 * SSOT for sitemap, llms.txt, and internal hub/spoke links.
 */

/** One public page the sitemap and AI index should know about. */
export interface DiscoverabilityPage {
  /** Site-relative path, e.g. `/compare`. */
  readonly path: string;
  /** Short title for llms.txt and internal links. */
  readonly title: string;
  /** One-line summary for AI crawlers. */
  readonly summary: string;
  /** SEO priority hint for sitemap (0–1). */
  readonly priority: number;
  /** changeFrequency for sitemap. */
  readonly changeFrequency: 'weekly' | 'monthly' | 'yearly';
}

/**
 * Primary marketing + GEO surfaces (home through legal).
 * Transactional routes stay out (checkout / success / cancel / api).
 */
export const CORE_DISCOVERABILITY_PAGES: readonly DiscoverabilityPage[] = [
  {
    path: '/',
    title: 'Home',
    summary:
      'VybeKiit product overview: one-time SaaS kit for AI coding agents with sign-in, database, payments, email, web, mobile, and extension bases.',
    priority: 1,
    changeFrequency: 'weekly',
  },
  {
    path: '/compare',
    title: 'SaaS boilerplate comparison',
    summary:
      'Master comparison matrix of SaaS starter kits with quick-pick by use case and honest where-rivals-win notes. Verified 2026-06-27.',
    priority: 0.95,
    changeFrequency: 'weekly',
  },
  {
    path: '/faq',
    title: 'FAQ',
    summary:
      'Answer-first FAQ: best SaaS boilerplate for a non-technical founder, ShipFast alternatives, taxes and VAT, Claude Code + Cursor, web + mobile + extension, and pricing.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/brand',
    title: 'Brand and media',
    summary:
      'Official brand facts, logo download, colors, and machine-readable product identity for partners and press.',
    priority: 0.5,
    changeFrequency: 'monthly',
  },
  {
    path: '/privacy',
    title: 'Privacy policy',
    summary: 'How VybeKiit handles visitor and buyer data.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
  {
    path: '/terms',
    title: 'Terms of service',
    summary: 'Purchase terms, refund window, and license boundaries.',
    priority: 0.3,
    changeFrequency: 'yearly',
  },
];

/** Wedge cluster — low competition, high ICP match (seo-geo-plan §1 Spoke C). */
export const WEDGE_DISCOVERABILITY_PAGES: readonly DiscoverabilityPage[] = [
  {
    path: '/saas-boilerplate-for-non-technical-founders',
    title: 'SaaS boilerplate for non-technical founders',
    summary:
      'Which starter kits work when you use Claude Code or Cursor but do not want to operate the codebase yourself.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/vibe-coding-saas',
    title: 'Vibe coding SaaS boilerplate',
    summary:
      'Agent-ready SaaS template for vibe coders: owned source, decide-and-guide agent layer, web + mobile + extension.',
    priority: 0.9,
    changeFrequency: 'monthly',
  },
  {
    path: '/ship-a-saas-with-ai-agents',
    title: 'Ship a SaaS with AI agents',
    summary:
      'How to go from idea to a maintainable product using an AI coding agent on a ready infrastructure base.',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/vybekiit-vs-lovable',
    title: 'VybeKiit vs Lovable',
    summary:
      'Owned SaaS boilerplate vs managed AI app builder: when to pick each for a real product you ship and maintain.',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/vybekiit-vs-bolt',
    title: 'VybeKiit vs Bolt',
    summary:
      'Agent-operated owned code base vs in-browser AI generation: trade-offs for founders who need production foundations.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/vybekiit-vs-replit',
    title: 'VybeKiit vs Replit',
    summary:
      'Hosted cloud IDE generation vs owned starter kit with payments, auth, and multi-surface bases pre-connected.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
];

/** High-intent "X alternative" spokes. */
export const ALTERNATIVE_DISCOVERABILITY_PAGES: readonly DiscoverabilityPage[] = [
  {
    path: '/shipfast-alternative',
    title: 'ShipFast alternative',
    summary:
      'Agent-first alternative to ShipFast for non-developers who want web, mobile, and extension in one purchase.',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/makerkit-alternative',
    title: 'MakerKit alternative',
    summary:
      'When MakerKit is better (deep B2B multi-tenant) and when VybeKiit is better (agent-operated for non-devs).',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/supastarter-alternative',
    title: 'Supastarter alternative',
    summary:
      'Feature-complete paid kits vs agent-operated base with three platforms and MoR default.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/anotherwrapper-alternative',
    title: 'AnotherWrapper alternative',
    summary:
      'AI wrapper demos vs agent-operated product infrastructure for shipping and maintaining a real app.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/open-saas-alternative',
    title: 'Open SaaS alternative',
    summary:
      'Free Wasp Open SaaS vs paid agent-ready Next.js + Expo + extension kit with MoR default.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/shipped-club-alternative',
    title: 'Shipped.club alternative',
    summary: 'Closest model rival (LS MoR + extension) vs three-platform agent-operated kit.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
];

/** Head-to-head "vs" spokes under /compare. */
export const VS_DISCOVERABILITY_PAGES: readonly DiscoverabilityPage[] = [
  {
    path: '/compare/vybekiit-vs-shipfast',
    title: 'VybeKiit vs ShipFast',
    summary:
      'Side-by-side: agent operator vs developer boilerplate, platforms, MoR, price, updates.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/compare/vybekiit-vs-makerkit',
    title: 'VybeKiit vs MakerKit',
    summary: 'Side-by-side: non-dev agent operator vs deep B2B multi-tenant developer kit.',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/compare/vybekiit-vs-supastarter',
    title: 'VybeKiit vs Supastarter',
    summary: 'Side-by-side: three platforms + MoR default vs feature-complete web-only paid kit.',
    priority: 0.75,
    changeFrequency: 'monthly',
  },
  {
    path: '/compare/vybekiit-vs-open-saas',
    title: 'VybeKiit vs Open SaaS',
    summary: 'Side-by-side: free Wasp OSS vs paid agent-ready multi-surface kit.',
    priority: 0.75,
    changeFrequency: 'monthly',
  },
  {
    path: '/compare/vybekiit-vs-anotherwrapper',
    title: 'VybeKiit vs AnotherWrapper',
    summary: 'Side-by-side: AI product demos vs agent-operated product foundations.',
    priority: 0.75,
    changeFrequency: 'monthly',
  },
];

/** Every indexable discoverability path (sitemap + llms). */
export const ALL_DISCOVERABILITY_PAGES: readonly DiscoverabilityPage[] = [
  ...CORE_DISCOVERABILITY_PAGES,
  ...WEDGE_DISCOVERABILITY_PAGES,
  ...ALTERNATIVE_DISCOVERABILITY_PAGES,
  ...VS_DISCOVERABILITY_PAGES,
];

/** Root-level dynamic GEO slugs (not under /compare). */
export const ROOT_GEO_SLUGS: readonly string[] = [
  ...WEDGE_DISCOVERABILITY_PAGES.map((page) => page.path.slice(1)),
  ...ALTERNATIVE_DISCOVERABILITY_PAGES.map((page) => page.path.slice(1)),
];

/** /compare/* vs slugs without the `/compare/` prefix. */
export const COMPARE_VS_SLUGS: readonly string[] = VS_DISCOVERABILITY_PAGES.map((page) =>
  page.path.replace('/compare/', ''),
);

/**
 * Look up a catalog entry by path.
 *
 * @param path - Site-relative path.
 * @returns Matching page or undefined.
 * @example
 * findDiscoverabilityPage('/compare')?.title
 */
export const findDiscoverabilityPage = (path: string): DiscoverabilityPage | undefined =>
  ALL_DISCOVERABILITY_PAGES.find((page) => page.path === path);
