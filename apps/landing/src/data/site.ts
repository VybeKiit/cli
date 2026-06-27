/**
 * Store-wide constants and copy for the VybeKiit landing site — data the
 * components render so the brand name, price, nav, and trust badges have one
 * authoritative home (per the repo's "separate data from UI" rule).
 */

/** The product's one-time price, in whole US dollars. */
const PRICE_USD = 29;

/**
 * Single source of truth for the displayed price. The $29 is flagged as parked /
 * likely underpriced (see CONTEXT.md → Parked), so it lives here as ONE constant —
 * changing the number is a one-line edit and every section updates.
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
} as const;

/** Brand identity strings shown in the header, footer, and metadata. */
export const BRAND = {
  name: 'VybeKiit',
  /** Meta-description / hero-adjacent tagline, drawn from the one-liner library. */
  tagline: 'The SaaS kit that ships itself.',
} as const;

/** One marketing nav link: where it points and the text shown. */
export interface NavLink {
  /** Destination path or in-page anchor, e.g. "#pricing". Also the render key. */
  readonly href: string;
  /** Visible link text. */
  readonly label: string;
}

/** Primary in-page nav links shown in the header (anchors to the home sections). */
export const HEADER_LINKS: readonly NavLink[] = [
  { href: '#pillars', label: 'How it works' },
  { href: '#compare', label: 'Compare' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

/** Footer links — legal pages every product needs. */
export const FOOTER_LINKS: readonly NavLink[] = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

/**
 * Trust badges shown near the primary CTA — the concrete promises that reverse
 * purchase risk (from the comparison matrix + landing-direction #10).
 */
export const TRUST_BADGES: readonly string[] = [
  'Merchant of Record (Lemon Squeezy)',
  `${PRICE.refundDays}-day refund`,
  'Web · mobile · extension',
];
