/**
 * Dashboard slugs that ship interactive surfaces instead of SaasPageView shells.
 * Kept free of `'use client'` so server helpers like `generateStaticParams` can
 * treat this as a plain array at build time.
 */
export const FEATURE_PAGE_SLUGS = [
  'dashboard',
  'settings',
  'teams',
  'orders',
  'integrations',
] as const;

export type FeaturePageSlug = (typeof FEATURE_PAGE_SLUGS)[number];

/**
 * Whether a dashboard slug is a Tier-1 interactive surface.
 *
 * @param slug - Dashboard route segment.
 * @returns True when the slug maps to a feature page.
 * @example
 * isFeaturePageSlug('orders'); // true
 */
export const isFeaturePageSlug = (slug: string): slug is FeaturePageSlug =>
  (FEATURE_PAGE_SLUGS as readonly string[]).includes(slug);
