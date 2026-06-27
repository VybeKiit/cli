/**
 * Pricing-card copy — what the one-time purchase includes and, per the honesty
 * rule (`docs/positioning/README.md`), what is NOT pre-built yet. Data only; the
 * Pricing section renders it. The price itself lives in `site.ts` as the single
 * `PRICE` constant.
 */

/** A single bullet in the pricing card's included/excluded lists. */
export interface PricingPoint {
  /** Stable render key. */
  readonly id: string;
  /** The line of copy shown next to the check / dash icon. */
  readonly text: string;
}

/** What every buyer gets for the one-time price. */
export const INCLUDED: readonly PricingPoint[] = [
  { id: 'agent', text: 'The agent layer that operates the build for you' },
  { id: 'three-platforms', text: 'Web, mobile, and browser-extension templates in one bundle' },
  { id: 'payments', text: 'Payments wired in — Lemon Squeezy (MoR), Stripe, or PayPal' },
  { id: 'auth-data', text: 'Auth and a database, ready to switch on' },
  { id: 'i18n', text: 'Auto-localized and RTL-ready from day one' },
  { id: 'updates', text: 'Maintained logic that updates as npm version bumps, no merges' },
  { id: 'deploy', text: 'A guided deploy to a custom domain when you are ready' },
] as const;

/**
 * What does NOT ship pre-built today — stated out loud. The agent writes any of
 * these on request, but the page must not imply they are in the box (the exact
 * overclaim that drives refunds).
 */
export const NOT_INCLUDED_YET: readonly PricingPoint[] = [
  { id: 'multi-tenant', text: 'Multi-tenancy / organizations' },
  { id: 'rbac', text: 'Role-based access control (roles & permissions)' },
  { id: 'admin', text: 'A super-admin dashboard with SaaS metrics' },
  { id: 'jobs', text: 'A background-jobs framework' },
  { id: 'blog', text: 'A blog / CMS engine' },
] as const;

/**
 * The honest footnote under the excluded list — frames the shorter pre-built list
 * as on-brand: VybeKiit sells a capability to build, not a frozen feature list.
 */
export const NOT_INCLUDED_NOTE =
  'These are not in the box today. Because you describe goals and the agent writes the code, "add team accounts" or "add roles" is a session, not a missing product. Need deep multi-tenant B2B on day one instead? MakerKit or Supastarter are the better buy.';
