/**
 * Navigation + footer links as data the header and footer render via `.map`.
 *
 * Why it lives here: the agent (and builder) add or reorder links by editing one
 * array, not JSX in two components. Each entry is a `{ href, label }`; the header's
 * brand link and the "Sign in" button stay in the component because they're
 * structural (different markup), not list items.
 */

/** One navigation link: where it points and the text shown. */
export interface NavLink {
  /** Destination path, e.g. "/pricing". Also used as the render key. */
  readonly href: string;
  /** Visible link text. */
  readonly label: string;
}

/** Primary marketing nav links shown in the header. */
export const HEADER_LINKS: readonly NavLink[] = [{ href: '/pricing', label: 'Pricing' }];

/** Legal links shown in the footer — every product needs these. */
export const FOOTER_LINKS: readonly NavLink[] = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];
