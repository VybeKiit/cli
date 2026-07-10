/**
 * Store-wide constants and copy for the VybeKiit landing site — data the
 * components render so the brand name, price, nav, and trust badges have one
 * authoritative home (per the repo's "separate data from UI" rule).
 */

/** The product's one-time price, in US dollars. */
const PRICE_USD = 29;

/** Post-launch-week price (early bird ends after launch week). */
const PRICE_AFTER_LAUNCH_USD = 49;

/** ShipFast $199 + useSAASkit mobile $249 + Shipped.club extension $207 — see comparison-matrix. */
const VALUE_STACK_USD = 655;

/**
 * Single source of truth for the displayed price. Early-bird $29 during launch week,
 * then $49 — one constant edit updates every section.
 */
export const PRICE = {
  /** Numeric amount in USD, for any math or schema markup. */
  amount: PRICE_USD,
  /** Display string with currency symbol, e.g. "$29". */
  display: `$${PRICE_USD}`,
  /** How the buyer is billed — a one-time purchase, not a subscription. */
  cadence: 'one-time',
  /** The risk-reversal window the offer promises. */
  refundDays: 14,
  /** Early-bird messaging for launch week. */
  earlyBirdNote: `$${PRICE_USD} launch week → $${PRICE_AFTER_LAUNCH_USD} after`,
} as const;

/**
 * Competitor-backed value stack for the pricing hero animation. Buying web + mobile +
 * extension separately from rival kits sums to $655; VybeKiit bundles all three for $29.
 */
export const PRICE_VALUE_STACK = {
  compareAtUsd: VALUE_STACK_USD,
  compareAtDisplay: `$${VALUE_STACK_USD}`,
  savingsUsd: VALUE_STACK_USD - PRICE_USD,
  savingsPercent: Math.ceil(((VALUE_STACK_USD - PRICE_USD) / VALUE_STACK_USD) * 100),
  basisNote:
    'Web + mobile + extension bought separately (ShipFast, useSAASkit, Shipped.club — verified 2026-06-27).',
} as const;

/** Brand identity strings shown in the header, footer, and metadata. */
export const BRAND = {
  name: 'VybeKiit',
  /**
   * Social / browser title tagline — the sentence platforms show when the URL is pasted.
   */
  tagline: 'The blueprint for vibe coders. Ship projects like a real software engineer.',
  /** Canonical production origin — the SSOT for metadataBase, canonical URLs, sitemap, robots, and OG. */
  url: 'https://vybekiit.com',
  /** One authoritative meta description, shared by the layout, Open Graph, and JSON-LD. */
  description:
    'The blueprint for vibe coders. Ship projects like a real software engineer. Describe your product in plain language; the agent builds it, deploys it, takes your first payment, and keeps it updated. Web, mobile, and a browser extension in one purchase.',
} as const;

/**
 * Search keywords for the landing metadata — the competitor + intent terms from
 * `docs/positioning/seo-geo-plan.md` that the FAQ answers target.
 */
export const SEO_KEYWORDS: readonly string[] = [
  'SaaS boilerplate',
  'SaaS starter kit',
  'AI SaaS boilerplate',
  'non-technical founder',
  'Next.js SaaS starter',
  'ship a SaaS with AI',
  'Claude Code SaaS',
  'Cursor SaaS boilerplate',
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
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

/** Footer links — legal pages every product needs. */
export const FOOTER_LINKS: readonly NavLink[] = [
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
