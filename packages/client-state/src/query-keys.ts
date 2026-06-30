/** TanStack Query key conventions — one place for auth, billing, and CMS cache seams. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  billing: {
    checkout: (productId: string) => ['billing', 'checkout', productId] as const,
  },
  cms: {
    page: (slug: string) => ['cms', 'page', slug] as const,
    list: ['cms', 'list'] as const,
  },
} as const;
