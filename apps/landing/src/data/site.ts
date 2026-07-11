/**
 * Store-wide constants and copy for the VybeKiit landing site — data the
 * components render so the brand name, price, nav, and trust badges have one
 * authoritative home (per the repo's "separate data from UI" rule).
 *
 * Live sell price climbs after each paid sale (see `src/lib/priceLadder.ts` +
 * `GET /api/pricing`). `PRICE` here is the **first-buyer / SSR fallback** so static
 * sections and schema stay coherent before the live snapshot loads.
 */

import { formatUsd, PRICE_LADDER, savingsPercentOffCeiling } from '@/lib/priceLadder';

/** First-buyer / marketing fallback amount (ladder start). */
const PRICE_USD = PRICE_LADDER.startUsd;

/** Post-launch soft target used only in early-bird note copy (not the ladder). */
const PRICE_AFTER_LAUNCH_USD = 49;

/** Competitor value stack / ladder ceiling (ShipFast + mobile + extension kits). */
const VALUE_STACK_USD = PRICE_LADDER.ceilingUsd;

/**
 * First-buyer price constants. Prefer `useLivePricing()` / `GET /api/pricing` for
 * the amount charged at checkout (rising ladder).
 */
export const PRICE = {
  /** Numeric amount in USD, for any math or schema markup. */
  amount: PRICE_USD,
  /** Display string with currency symbol, e.g. "$29". */
  display: formatUsd(PRICE_USD),
  /** How the buyer is billed — a one-time purchase, not a subscription. */
  cadence: 'one-time',
  /** The risk-reversal window the offer promises. */
  refundDays: 14,
  /** Early-bird messaging for launch week. */
  earlyBirdNote: `${formatUsd(PRICE_USD)} launch · every purchase raises the price (max ${formatUsd(VALUE_STACK_USD)})`,
  /** Soft post-launch reference (not enforced by the ladder). */
  afterLaunchNote: formatUsd(PRICE_AFTER_LAUNCH_USD),
} as const;

/**
 * Competitor-backed value stack for the pricing hero animation. Buying web + mobile +
 * extension separately from rival kits sums to $655; the ladder sells under that ceiling.
 */
export const PRICE_VALUE_STACK = {
  compareAtUsd: VALUE_STACK_USD,
  compareAtDisplay: formatUsd(VALUE_STACK_USD),
  savingsUsd: VALUE_STACK_USD - PRICE_USD,
  savingsPercent: savingsPercentOffCeiling(PRICE_USD),
  basisNote:
    'Web + mobile + extension bought separately (ShipFast, useSAASkit, Shipped.club — verified 2026-06-27).',
} as const;

/** Brand identity strings shown in the header, footer, and metadata. */
export const BRAND = {
  name: 'VybeKiit',
  /**
   * Social / browser title tagline — the sentence platforms show when the URL is pasted.
   */
  tagline: 'Ready infrastructure for products built with AI.',
  /** Canonical production origin — the SSOT for metadataBase, canonical URLs, sitemap, robots, and OG. */
  url: 'https://vybekiit.com',
  /** One authoritative meta description, shared by the layout, Open Graph, and JSON-LD. */
  description:
    'Ready infrastructure for AI agents. A code base with sign-in, database, payments, email, dashboard, monitoring, and deploy already connected so your agent can turn a local project into a real product you can ship and maintain. One-time purchase. Web, mobile, and browser-extension base.',
} as const;

/**
 * Search keywords for the landing metadata — the competitor + intent terms from
 * `docs/positioning/seo-geo-plan.md` that the FAQ answers target.
 */
export const SEO_KEYWORDS: readonly string[] = [
  'SaaS boilerplate',
  'SaaS starter kit',
  'SaaS boilerplate comparison',
  'AI SaaS boilerplate',
  'agent-ready SaaS boilerplate',
  'vibe coding SaaS',
  'non-technical founder',
  'SaaS boilerplate for non-technical founders',
  'Next.js SaaS starter',
  'ship a SaaS with AI',
  'Claude Code SaaS',
  'Cursor SaaS boilerplate',
  'ShipFast alternative',
  'MakerKit alternative',
  'web mobile extension kit',
  'Lemon Squeezy merchant of record',
];

/** One marketing nav link: where it points and the text shown. */
export interface NavLink {
  /** Destination path or in-page anchor, e.g. "#pricing". Also the render key. */
  readonly href: string;
  /** Visible link text. */
  readonly label: string;
}

/**
 * Primary nav links in the header.
 * Absolute home anchors so they work from /checkout and other store pages too.
 */
export const HEADER_LINKS: readonly NavLink[] = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/compare', label: 'Compare' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

/** Footer links — legal + discoverability hubs. */
export const FOOTER_LINKS: readonly NavLink[] = [
  { href: '/compare', label: 'Compare kits' },
  { href: '/brand', label: 'Brand' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

/** Trust badges shown near the primary CTA — the concrete promises that reverse
 * purchase risk (from the comparison matrix + landing-direction #10).
 */
export const TRUST_BADGES: readonly string[] = [
  'Merchant of Record (Lemon Squeezy)',
  `${PRICE.refundDays}-day refund`,
  'Web · mobile · extension',
];

/**
 * Loom or YouTube embed URL for the keystone demo. Empty until recorded — set before
 * cold email (see docs/gtm/loom-recording-guide.md).
 */
export const DEMO_VIDEO_EMBED_URL = '';

/** Kit support channels — kit bugs only (see CONTEXT.md support boundary). */
export const SUPPORT: {
  discordUrl: string;
  kitEmail: string;
} = {
  /**
   * Discord invite URL — set `NEXT_PUBLIC_DISCORD_URL` before launch
   * (see docs/gtm/discord-setup.md).
   */
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL ?? '',
  /** Public contact email shown in the store footer. */
  kitEmail: 'info@vybekiit.com',
};
