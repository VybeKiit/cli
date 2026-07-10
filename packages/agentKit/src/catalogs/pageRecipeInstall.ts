/**
 * Goal skill → page recipe install map (Option C long-tail).
 * Agents install recipe source from the component library before wiring providers.
 */

export type PageRecipeInstall = {
  readonly goalId: string;
  readonly recipeId: string;
  readonly sourcePath: string;
  readonly exportName: string;
  readonly targetRoute: string;
  readonly presetIds: readonly string[];
};

/**
 * Long-tail features install from the page recipe catalog instead of shipping in every template.
 * Core Tier-1 web surfaces (settings, teams, orders, dashboard, integrations) ship in templates.
 * Orphan ids (`commerce-*`, `crm-*`, `productivity-*`, `content-*`, `feature-flags`, `admin-panel`,
 * `billing-admin`, `support-center`) have no dedicated buyer skill yet — agents look them up by id
 * when a builder asks for that surface (e.g. from setup-payments commerce notes).
 */
export const PAGE_RECIPE_INSTALLS: readonly PageRecipeInstall[] = [
  {
    goalId: 'onboarding',
    recipeId: 'onboarding',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/OnboardingPage.tsx',
    exportName: 'OnboardingPage',
    targetRoute: '/onboarding',
    presetIds: [],
  },
  {
    goalId: 'sign-in',
    recipeId: 'auth',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx',
    exportName: 'AuthPage',
    targetRoute: '/login',
    presetIds: ['auth-bridge'],
  },
  {
    goalId: 'reset-password',
    recipeId: 'account-security',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AccountSecurityPage.tsx',
    exportName: 'AccountSecurityPage',
    targetRoute: '/settings/security',
    presetIds: ['auth-bridge'],
  },
  {
    goalId: 'sign-in-with-email-link',
    recipeId: 'auth',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx',
    exportName: 'AuthPage',
    targetRoute: '/login',
    presetIds: ['auth-bridge'],
  },
  {
    goalId: 'sign-in-with-phone',
    recipeId: 'auth',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx',
    exportName: 'AuthPage',
    targetRoute: '/login',
    presetIds: ['auth-bridge'],
  },
  {
    goalId: 'sign-in-with-google',
    recipeId: 'auth',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx',
    exportName: 'AuthPage',
    targetRoute: '/login',
    presetIds: ['auth-bridge'],
  },
  {
    goalId: 'add-ai',
    recipeId: 'ai-assistant',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AiAssistantPage.tsx',
    exportName: 'AiAssistantPage',
    targetRoute: '/dashboard/ai',
    presetIds: ['ai_conversations', 'embeddings'],
  },
  {
    goalId: 'add-search',
    recipeId: 'search',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/SearchPage.tsx',
    exportName: 'SearchPage',
    targetRoute: '/dashboard/search',
    presetIds: ['search_documents', 'embeddings'],
  },
  {
    goalId: 'add-realtime',
    recipeId: 'realtime',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/RealtimePage.tsx',
    exportName: 'RealtimePage',
    targetRoute: '/dashboard/realtime',
    presetIds: ['realtime_publications'],
  },
  {
    goalId: 'add-blog',
    recipeId: 'blog',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/BlogPage.tsx',
    exportName: 'BlogPage',
    targetRoute: '/blog',
    presetIds: [],
  },
  {
    goalId: 'add-files',
    recipeId: 'file-manager',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/FileManagerPage.tsx',
    exportName: 'FileManagerPage',
    targetRoute: '/dashboard/files',
    presetIds: ['file_metadata'],
  },
  {
    goalId: 'add-notifications',
    recipeId: 'notifications-center',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/NotificationsCenterPage.tsx',
    exportName: 'NotificationsCenterPage',
    targetRoute: '/dashboard/notifications',
    presetIds: ['notifications_log'],
  },
  {
    goalId: 'setup-email',
    recipeId: 'email-notifications',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/EmailNotificationsPage.tsx',
    exportName: 'EmailNotificationsPage',
    targetRoute: '/dashboard/email',
    presetIds: ['notifications_log'],
  },
  {
    goalId: 'add-analytics',
    recipeId: 'analytics',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AnalyticsPage.tsx',
    exportName: 'AnalyticsPage',
    targetRoute: '/dashboard/analytics',
    presetIds: [],
  },
  {
    goalId: 'add-teams',
    recipeId: 'teams',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/TeamsPage.tsx',
    exportName: 'TeamsPage',
    targetRoute: '/dashboard/teams',
    presetIds: ['organizations'],
  },
  {
    goalId: 'setup-payments',
    recipeId: 'pricing',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/PricingPage.tsx',
    exportName: 'PricingPage',
    targetRoute: '/pricing',
    presetIds: ['orders', 'webhook_events'],
  },
  {
    goalId: 'check-safety',
    recipeId: 'safety',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/SafetyPage.tsx',
    exportName: 'SafetyPage',
    targetRoute: '/dashboard/safety',
    presetIds: [],
  },
  {
    goalId: 'harden',
    recipeId: 'audit-log',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AuditLogPage.tsx',
    exportName: 'AuditLogPage',
    targetRoute: '/admin/audit',
    presetIds: ['audit_log'],
  },
  {
    goalId: 'add-images',
    recipeId: 'brand-assets',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/BrandAssetsPage.tsx',
    exportName: 'BrandAssetsPage',
    targetRoute: '/dashboard/brand',
    presetIds: [],
  },
  {
    goalId: 'add-language',
    recipeId: 'language',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/LanguagePage.tsx',
    exportName: 'LanguagePage',
    targetRoute: '/dashboard/language',
    presetIds: [],
  },
  {
    goalId: 'track-errors',
    recipeId: 'system-health',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/SystemHealthPage.tsx',
    exportName: 'SystemHealthPage',
    targetRoute: '/admin/health',
    presetIds: [],
  },
  {
    goalId: 'go-live',
    recipeId: 'launch-checklist',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/LaunchChecklistPage.tsx',
    exportName: 'LaunchChecklistPage',
    targetRoute: '/dashboard/launch',
    presetIds: ['job_runs'],
  },
  {
    goalId: 'buy-domain',
    recipeId: 'launch-checklist',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/LaunchChecklistPage.tsx',
    exportName: 'LaunchChecklistPage',
    targetRoute: '/dashboard/launch',
    presetIds: ['job_runs'],
  },
  // Orphan catalog installs (no dedicated goal skill yet — agents look up by id)
  {
    goalId: 'commerce-products',
    recipeId: 'product-grid',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/ProductGridPage.tsx',
    exportName: 'ProductGridPage',
    targetRoute: '/products',
    presetIds: [],
  },
  {
    goalId: 'commerce-cart',
    recipeId: 'cart',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/CartPage.tsx',
    exportName: 'CartPage',
    targetRoute: '/cart',
    presetIds: ['orders'],
  },
  {
    goalId: 'commerce-checkout',
    recipeId: 'checkout',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/CheckoutPage.tsx',
    exportName: 'CheckoutPage',
    targetRoute: '/checkout',
    presetIds: ['orders', 'webhook_events'],
  },
  {
    goalId: 'support-center',
    recipeId: 'support-center',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/SupportCenterPage.tsx',
    exportName: 'SupportCenterPage',
    targetRoute: '/support',
    presetIds: [],
  },
  {
    goalId: 'crm-customers',
    recipeId: 'customers',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/CustomersPage.tsx',
    exportName: 'CustomersPage',
    targetRoute: '/customers',
    presetIds: [],
  },
  {
    goalId: 'crm-pipeline',
    recipeId: 'pipeline',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/PipelinePage.tsx',
    exportName: 'PipelinePage',
    targetRoute: '/pipeline',
    presetIds: [],
  },
  {
    goalId: 'productivity-tasks',
    recipeId: 'tasks',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/TasksPage.tsx',
    exportName: 'TasksPage',
    targetRoute: '/tasks',
    presetIds: [],
  },
  {
    goalId: 'productivity-calendar',
    recipeId: 'calendar',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/CalendarPage.tsx',
    exportName: 'CalendarPage',
    targetRoute: '/calendar',
    presetIds: [],
  },
  {
    goalId: 'content-docs',
    recipeId: 'docs',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/DocsPage.tsx',
    exportName: 'DocsPage',
    targetRoute: '/docs',
    presetIds: [],
  },
  {
    goalId: 'content-status',
    recipeId: 'status',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/StatusPage.tsx',
    exportName: 'StatusPage',
    targetRoute: '/status',
    presetIds: [],
  },
  {
    goalId: 'content-changelog',
    recipeId: 'changelog',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/ChangelogPage.tsx',
    exportName: 'ChangelogPage',
    targetRoute: '/changelog',
    presetIds: [],
  },
  {
    goalId: 'feature-flags',
    recipeId: 'feature-flags',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/FeatureFlagsPage.tsx',
    exportName: 'FeatureFlagsPage',
    targetRoute: '/admin/feature-flags',
    presetIds: ['feature_flags'],
  },
  {
    goalId: 'admin-panel',
    recipeId: 'admin-panel',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/AdminPanelPage.tsx',
    exportName: 'AdminPanelPage',
    targetRoute: '/admin',
    presetIds: [],
  },
  {
    goalId: 'billing-admin',
    recipeId: 'billing-admin',
    sourcePath: 'apps/componentLibrary/src/pageRecipes/BillingAdminPage.tsx',
    exportName: 'BillingAdminPage',
    targetRoute: '/admin/billing',
    presetIds: ['orders'],
  },
];

export const PAGE_RECIPE_INSTALL_BY_GOAL: Readonly<Record<string, PageRecipeInstall>> =
  Object.fromEntries(PAGE_RECIPE_INSTALLS.map((entry) => [entry.goalId, entry]));

/**
 * Look up the page recipe an agent should install for a buyer goal skill.
 *
 * @param goalId - Goal catalog id (e.g. `add-ai`).
 * @returns Install metadata, or undefined when the skill has no recipe install step.
 * @example
 * const install = getPageRecipeInstall('add-search');
 */
export const getPageRecipeInstall = (goalId: string): PageRecipeInstall | undefined =>
  PAGE_RECIPE_INSTALL_BY_GOAL[goalId];

/**
 * Markdown step block agents paste into long-tail skill runs.
 *
 * @param goalId - Goal catalog id.
 * @returns Numbered install step markdown, or empty string when no recipe is mapped.
 * @example
 * const step = renderPageRecipeInstallStep('add-ai');
 */
export const renderPageRecipeInstallStep = (goalId: string): string => {
  const install = getPageRecipeInstall(goalId);
  if (install === undefined) {
    return '';
  }
  const presets =
    install.presetIds.length === 0
      ? 'none'
      : install.presetIds.map((id) => `\`vybekiit apply-preset ${id}\``).join(', ');
  return [
    '**Install the page recipe first (catalog SSOT).**',
    `Copy \`${install.sourcePath}\` export \`${install.exportName}\` into the buyer app at route \`${install.targetRoute}\`.`,
    `Recipe id: \`${install.recipeId}\`. Apply presets if listed: ${presets}.`,
    'Keep recipe `TODO:` comments and wire each one before celebrating.',
    '**Verify:** the route renders locally with practice data; then wire providers.',
  ].join(' ');
};
