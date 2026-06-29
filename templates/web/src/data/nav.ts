/**
 * Navigation + footer links as data the header and footer render via `.map`.
 *
 * Labels are message-catalog keys — components resolve them with `t(labelKey)`.
 */

/** One navigation link: where it points and the message key for its label. */
export interface NavLink {
  /** Destination path without locale prefix, e.g. "/pricing". */
  readonly href: string;
  /** Flat-dotted key in `messages/en.json`. */
  readonly labelKey: string;
}

/** Primary marketing nav links shown in the header. */
export const HEADER_LINKS: readonly NavLink[] = [
  { href: '/pricing', labelKey: 'common.nav.pricing' },
];

/** Legal links shown in the footer — every product needs these. */
export const FOOTER_LINKS: readonly NavLink[] = [
  { href: '/terms', labelKey: 'common.nav.terms' },
  { href: '/privacy', labelKey: 'common.nav.privacy' },
];
