import { DASHBOARD_SAAS_PAGES as dashboardSaasPages } from '@/data/dashboardSaasPages';
import { PUBLIC_SAAS_PAGES as publicSaasPages } from '@/data/publicSaasPages';
import type { SaasPageDefinition } from '@/data/saasPageTypes';

const publicSaasPagesBySlug: Readonly<Record<string, SaasPageDefinition>> = Object.fromEntries(
  publicSaasPages.map((page) => [page.slug, page]),
);

const dashboardSaasPagesBySlug: Readonly<Record<string, SaasPageDefinition>> = Object.fromEntries(
  dashboardSaasPages.map((page) => [page.slug, page]),
);

/**
 * Find a public SaaS page definition by route slug.
 *
 * @param slug - Public route slug from Next.js params.
 * @returns The matching public page definition, or undefined when the route is unknown.
 * @example
 * const page = getPublicSaasPage('products');
 */
const getPublicSaasPage = (slug: string): SaasPageDefinition | undefined => {
  const page = publicSaasPagesBySlug[slug];
  if (page === undefined) {
    return;
  }
  return page;
};

/**
 * Find a signed-in dashboard SaaS page definition by route slug.
 *
 * @param slug - Dashboard route slug from Next.js params.
 * @returns The matching dashboard page definition, or undefined when the route is unknown.
 * @example
 * const page = getDashboardSaasPage('settings');
 */
const getDashboardSaasPage = (slug: string): SaasPageDefinition | undefined => {
  const page = dashboardSaasPagesBySlug[slug];
  if (page === undefined) {
    return;
  }
  return page;
};

export { getDashboardSaasPage, getPublicSaasPage };
