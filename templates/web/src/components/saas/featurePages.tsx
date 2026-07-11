import type { ComponentType } from 'react';

import { DashboardHomePage } from '@/components/saas/dashboardHome';
import { IntegrationsPage } from '@/components/saas/integrations';
import { OrdersPage } from '@/components/saas/orders';
import { TeamsPage } from '@/components/saas/teams';
import { UserSettingsPage } from '@/components/saas/userSettings';
import { isFeaturePageSlug, type FeaturePageSlug } from '@/data/featurePageSlugs';

/**
 * Client page components keyed by dashboard slug. This module stays server-safe
 * (no `'use client'`) so route handlers can pick a component and render it.
 */
const FEATURE_PAGES: Readonly<Record<FeaturePageSlug, ComponentType>> = {
  dashboard: DashboardHomePage,
  settings: UserSettingsPage,
  teams: TeamsPage,
  orders: OrdersPage,
  integrations: IntegrationsPage,
};

/**
 * Resolve an interactive dashboard feature page by route slug.
 *
 * @param slug - Dashboard route segment.
 * @returns The page component, or undefined when the slug still uses a shell.
 * @example
 * const Page = getFeaturePage('settings');
 */
export const getFeaturePage = (slug: string): ComponentType | undefined => {
  if (!isFeaturePageSlug(slug)) {
    return;
  }
  return FEATURE_PAGES[slug];
};
