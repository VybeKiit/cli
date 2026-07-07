/** TanStack Query key conventions — one place for auth, billing, and CMS cache seams. */
/**
 * Build the billing checkout query key for a product.
 *
 * @param productId - Product id for the checkout request.
 * @returns Stable TanStack Query key for checkout state.
 * @example
 * const key = checkoutQueryKey('starter');
 */
export const checkoutQueryKey = (productId: string): readonly ['billing', 'checkout', string] => [
  'billing',
  'checkout',
  productId,
];

/**
 * Build the CMS page query key for a slug.
 *
 * @param slug - CMS page slug.
 * @returns Stable TanStack Query key for page content.
 * @example
 * const key = cmsPageQueryKey('home');
 */
export const cmsPageQueryKey = (slug: string): readonly ['cms', 'page', string] => [
  'cms',
  'page',
  slug,
];

/** TanStack Query key conventions for auth, billing, and CMS cache seams. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  billing: {
    checkout: checkoutQueryKey,
  },
  cms: {
    page: cmsPageQueryKey,
    list: ['cms', 'list'] as const,
  },
} as const;
