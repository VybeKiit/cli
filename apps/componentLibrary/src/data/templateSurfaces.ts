/** Template preview surfaces exposed in the component-library sidebar. */
export type TemplateSurfaceId = 'website-saas' | 'mobile-saas' | 'extension-saas';

/** One route group shown in a template surface overview. */
export interface TemplateSurfaceRoute {
  readonly label: string;
  readonly route: string;
  readonly description: string;
}

/** One live iframe preview shown for a template surface. */
export interface TemplateSurfacePreview {
  readonly label: string;
  readonly description: string;
  readonly slug: string;
  readonly viewportLabel: string;
  readonly width: number;
  readonly height: number;
}

/** One playable nested route in a template surface preview app. */
export interface TemplateSurfaceAppRoute {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly description: string;
  readonly recipeSlug: string;
  readonly viewportLabel: string;
  readonly width: number;
  readonly height: number;
}

interface TemplateSurfaceAppRouteSeed {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly description: string;
  readonly recipeSlug: string;
}

/** Full metadata needed to render one SaaS template preview surface. */
export interface TemplateSurface {
  readonly id: TemplateSurfaceId;
  readonly href: string;
  readonly navLabel: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly sourceTemplate: string;
  readonly defaultRouteId: string;
  readonly appRoutes: readonly TemplateSurfaceAppRoute[];
  readonly routeStack: readonly TemplateSurfaceRoute[];
  readonly previews: readonly TemplateSurfacePreview[];
  readonly recipeSlugs: readonly string[];
}

/** Sidebar navigation items for the template preview surfaces. */
export const TEMPLATE_SURFACE_NAV_ITEMS: ReadonlyArray<{
  readonly id: TemplateSurfaceId;
  readonly href: string;
  readonly label: string;
}> = [
  { id: 'website-saas', href: '/website-saas', label: 'Website SaaS' },
  { id: 'mobile-saas', href: '/mobile-saas', label: 'Mobile SaaS' },
  { id: 'extension-saas', href: '/extension-saas', label: 'Extension SaaS' },
];

const QUICK_WIN_TEMPLATE_ROUTE_SEEDS: readonly TemplateSurfaceAppRouteSeed[] = [
  {
    id: 'user-settings',
    label: 'User settings',
    path: 'user-settings',
    description: 'Profile, account, sessions, connected accounts, and danger-zone controls.',
    recipeSlug: 'user-settings',
  },
  {
    id: 'security',
    label: 'Security',
    path: 'security',
    description: 'Two-factor authentication, active sessions, and recovery code controls.',
    recipeSlug: 'account-security',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: 'notifications',
    description: 'Notification inbox, unread states, and channel preferences.',
    recipeSlug: 'notifications-center',
  },
  {
    id: 'support',
    label: 'Support',
    path: 'support',
    description: 'Tickets, docs search, contact support, and status handoff.',
    recipeSlug: 'support-center',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: 'integrations',
    description: 'API keys, webhooks, OAuth apps, and connected tools.',
    recipeSlug: 'integrations',
  },
  {
    id: 'products',
    label: 'Products',
    path: 'products',
    description: 'Generic ecommerce product card grid with filters and quick add.',
    recipeSlug: 'product-grid',
  },
  {
    id: 'product-detail',
    label: 'Product detail',
    path: 'product-detail',
    description: 'Product gallery, variants, quantity, reviews, and related items.',
    recipeSlug: 'product-detail',
  },
  {
    id: 'cart',
    label: 'Cart',
    path: 'cart',
    description: 'Cart line items, coupon, totals, and checkout handoff.',
    recipeSlug: 'cart',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    path: 'checkout',
    description: 'Contact, shipping, payment, and order summary flow.',
    recipeSlug: 'checkout',
  },
  {
    id: 'orders',
    label: 'Orders',
    path: 'orders',
    description: 'Order history, invoices, fulfillment, tracking, and reorders.',
    recipeSlug: 'orders',
  },
  {
    id: 'admin-users',
    label: 'User management',
    path: 'admin-users',
    description: 'Admin users table, roles, suspend, restore, and invite controls.',
    recipeSlug: 'user-management',
  },
  {
    id: 'audit-log',
    label: 'Audit log',
    path: 'audit-log',
    description: 'Filterable audit trail with actor, target, severity, and export.',
    recipeSlug: 'audit-log',
  },
  {
    id: 'admin-billing',
    label: 'Billing admin',
    path: 'admin-billing',
    description: 'Subscriptions, failed payments, invoices, credits, and retries.',
    recipeSlug: 'billing-admin',
  },
  {
    id: 'system-health',
    label: 'System health',
    path: 'system-health',
    description: 'Services, queues, cron jobs, uptime, and incident thresholds.',
    recipeSlug: 'system-health',
  },
  {
    id: 'roles',
    label: 'Roles',
    path: 'roles',
    description: 'Role permissions matrix, invite policy, and owner safeguards.',
    recipeSlug: 'role-permissions',
  },
  {
    id: 'customers',
    label: 'Customers',
    path: 'customers',
    description: 'Customer database, segments, account owners, and health states.',
    recipeSlug: 'customers',
  },
  {
    id: 'customer-detail',
    label: 'Customer detail',
    path: 'customer-detail',
    description: 'Customer timeline, notes, invoices, support tickets, and owner controls.',
    recipeSlug: 'customer-detail',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    path: 'pipeline',
    description: 'CRM pipeline board with opportunity cards and next actions.',
    recipeSlug: 'pipeline',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: 'tasks',
    description: 'Task list, priorities, assignees, due dates, and bulk actions.',
    recipeSlug: 'tasks',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: 'calendar',
    description: 'Events, bookings, reminders, conflicts, and sync states.',
    recipeSlug: 'calendar',
  },
  {
    id: 'command-center',
    label: 'Command center',
    path: 'command-center',
    description: 'Command palette, action launcher, and recent shortcuts.',
    recipeSlug: 'command-center',
  },
  {
    id: 'media',
    label: 'Media',
    path: 'media',
    description: 'Media gallery, uploads, preview panel, tags, and metadata.',
    recipeSlug: 'media-gallery',
  },
  {
    id: 'docs',
    label: 'Docs',
    path: 'docs',
    description: 'Documentation sidebar, article view, search, and feedback states.',
    recipeSlug: 'docs',
  },
  {
    id: 'status',
    label: 'Status',
    path: 'status',
    description: 'Public service status, incidents, uptime, and subscriptions.',
    recipeSlug: 'status',
  },
  {
    id: 'changelog',
    label: 'Changelog',
    path: 'changelog',
    description: 'Product release timeline, tags, subscriptions, and publish states.',
    recipeSlug: 'changelog',
  },
];

const QUICK_WIN_RECIPE_SLUGS = [
  'dashboard-home',
  ...QUICK_WIN_TEMPLATE_ROUTE_SEEDS.map((route) => route.recipeSlug),
] as const;

/**
 * Apply a viewport preset to reusable nested template routes.
 *
 * @param routes - Route seeds without viewport dimensions.
 * @param viewportLabel - Human-readable viewport label for the preview.
 * @param width - Iframe viewport width.
 * @param height - Iframe viewport height.
 * @returns Route metadata with viewport dimensions applied.
 * @example
 * const routes = templateRoutesForViewport(QUICK_WIN_TEMPLATE_ROUTE_SEEDS, 'Desktop 1280 x 760', 1280, 760);
 */
const templateRoutesForViewport = (
  routes: readonly TemplateSurfaceAppRouteSeed[],
  viewportLabel: string,
  width: number,
  height: number,
): readonly TemplateSurfaceAppRoute[] =>
  routes.map((route) => ({
    ...route,
    viewportLabel,
    width,
    height,
  }));

/**
 * Resolve the default route for a template surface.
 *
 * @param surface - Template surface metadata.
 * @returns The configured default app route.
 * @example
 * const route = defaultTemplateSurfaceRoute(TEMPLATE_SURFACES['website-saas']);
 */
export const defaultTemplateSurfaceRoute = (surface: TemplateSurface): TemplateSurfaceAppRoute => {
  const route = surface.appRoutes.find((candidate) => candidate.id === surface.defaultRouteId);
  if (route === undefined) {
    throw new Error(`Missing default template route: ${surface.id}/${surface.defaultRouteId}`);
  }
  return route;
};

/**
 * Resolve a nested route path inside a template surface.
 *
 * @param surface - Template surface metadata.
 * @param path - Nested route path segment from Next.js params.
 * @returns The matching route, or undefined when the path is unknown.
 * @example
 * const route = templateSurfaceRouteByPath(surface, 'teams');
 */
export const templateSurfaceRouteByPath = (
  surface: TemplateSurface,
  path: string,
): TemplateSurfaceAppRoute | undefined =>
  surface.appRoutes.find((candidate) => candidate.path === path);

/** Render-ready metadata for website, mobile, and extension SaaS template surfaces. */
export const TEMPLATE_SURFACES: Record<TemplateSurfaceId, TemplateSurface> = {
  'website-saas': {
    id: 'website-saas',
    href: '/website-saas',
    navLabel: 'Website SaaS',
    title: 'Website SaaS template',
    eyebrow: 'templates/web',
    summary:
      'A full web SaaS surface with auth, onboarding, dashboard, teams, analytics, billing, legal, and launch pages.',
    sourceTemplate: 'templates/web',
    defaultRouteId: 'dashboard',
    appRoutes: [
      {
        id: 'signup',
        label: 'Signup',
        path: 'signup',
        description: 'Account entry with email, password, phone code, and Google actions.',
        recipeSlug: 'auth',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'onboarding',
        label: 'Onboarding',
        path: 'onboarding',
        description: 'Post-signup setup flow before the buyer reaches the dashboard.',
        recipeSlug: 'onboarding',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: 'dashboard',
        description: 'Signed-in dashboard home with overview cards and next actions.',
        recipeSlug: 'dashboard-home',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'files',
        label: 'Files',
        path: 'files',
        description: 'Upload and manage documents with a visible loading state.',
        recipeSlug: 'file-manager',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'teams',
        label: 'Teams',
        path: 'teams',
        description: 'Invite members and change roles with the shared Select component.',
        recipeSlug: 'teams',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'billing',
        label: 'Billing',
        path: 'billing',
        description: 'Plan comparison and checkout starting point for paid SaaS apps.',
        recipeSlug: 'pricing',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'settings',
        label: 'Settings',
        path: 'settings',
        description: 'Feature flags and workspace controls for post-login settings.',
        recipeSlug: 'feature-flags',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        id: 'admin',
        label: 'Admin',
        path: 'admin',
        description: 'Owner control center for users, billing risk, support, and audit events.',
        recipeSlug: 'admin-panel',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      ...templateRoutesForViewport(QUICK_WIN_TEMPLATE_ROUTE_SEEDS, 'Desktop 1280 x 760', 1280, 760),
    ],
    routeStack: [
      {
        label: 'Marketing and pricing',
        route: '/pricing',
        description: 'Public offer page with checkout-ready plan cards and comparison states.',
      },
      {
        label: 'Auth and signup',
        route: '/login, /signup, /verify',
        description: 'Default account entry points before onboarding starts.',
      },
      {
        label: 'App onboarding',
        route: '/onboarding',
        description: 'Runs after signup and before the first dashboard view.',
      },
      {
        label: 'Dashboard, settings, and admin',
        route: '/dashboard, /settings, /admin',
        description:
          'Signed-in shell with sidebar navigation, owner controls, and operational pages.',
      },
    ],
    previews: [
      {
        label: 'Signup and auth',
        description: 'Desktop auth flow with email, password, phone code, and Google actions.',
        slug: 'auth',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        label: 'App onboarding',
        description: 'First signed-in step before a new buyer reaches the dashboard.',
        slug: 'onboarding',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
      {
        label: 'Logged-in dashboard',
        description: 'Analytics page inside the shared SaaS sidebar shell.',
        slug: 'analytics',
        viewportLabel: 'Desktop 1280 x 760',
        width: 1280,
        height: 760,
      },
    ],
    recipeSlugs: [
      'pricing',
      'auth',
      'onboarding',
      'analytics',
      'teams',
      'feature-flags',
      'admin-panel',
      ...QUICK_WIN_RECIPE_SLUGS,
    ],
  },
  'mobile-saas': {
    id: 'mobile-saas',
    href: '/mobile-saas',
    navLabel: 'Mobile SaaS',
    title: 'Mobile SaaS template',
    eyebrow: 'templates/mobile',
    summary:
      'A mobile-first SaaS route stack for signup, verification, app onboarding, pricing, dashboard, and account settings.',
    sourceTemplate: 'templates/mobile',
    defaultRouteId: 'dashboard',
    appRoutes: [
      {
        id: 'signup',
        label: 'Signup',
        path: 'signup',
        description: 'Phone-width account entry with safe default auth actions.',
        recipeSlug: 'auth',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'onboarding',
        label: 'Onboarding',
        path: 'onboarding',
        description: 'Mobile setup checklist after signup and before dashboard.',
        recipeSlug: 'onboarding',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: 'dashboard',
        description: 'Mobile signed-in dashboard home with stats and next actions.',
        recipeSlug: 'dashboard-home',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'files',
        label: 'Files',
        path: 'files',
        description: 'Small-screen file manager and upload flow.',
        recipeSlug: 'file-manager',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'teams',
        label: 'Teams',
        path: 'teams',
        description: 'Mobile team roles and invite controls.',
        recipeSlug: 'teams',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'billing',
        label: 'Billing',
        path: 'billing',
        description: 'Phone-width pricing and checkout route.',
        recipeSlug: 'pricing',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'settings',
        label: 'Settings',
        path: 'settings',
        description: 'Mobile feature flags and safety controls.',
        recipeSlug: 'feature-flags',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        id: 'admin',
        label: 'Admin',
        path: 'admin',
        description: 'Mobile owner console for users, support, billing risk, and audit events.',
        recipeSlug: 'admin-panel',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      ...templateRoutesForViewport(QUICK_WIN_TEMPLATE_ROUTE_SEEDS, 'Mobile 390 x 844', 390, 844),
    ],
    routeStack: [
      {
        label: 'Welcome and signup',
        route: '/, /signup, /login',
        description: 'Short mobile entry flow with safe defaults and clear account actions.',
      },
      {
        label: 'Verify and onboard',
        route: '/verify, /onboarding',
        description: 'Account confirmation followed by the first setup checklist.',
      },
      {
        label: 'Dashboard and admin',
        route: '/dashboard, /admin',
        description: 'Signed-in mobile dashboard with owner controls, stats, and support actions.',
      },
      {
        label: 'Pricing',
        route: '/pricing',
        description: 'Plan comparison adapted to small screens.',
      },
    ],
    previews: [
      {
        label: 'Mobile auth',
        description: 'Default phone-size auth flow with code and social actions.',
        slug: 'auth',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        label: 'Mobile onboarding',
        description: 'Checklist flow between signup and dashboard.',
        slug: 'onboarding',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
      {
        label: 'Mobile pricing',
        description: 'Checkout-starting plan cards at phone width.',
        slug: 'pricing',
        viewportLabel: 'Mobile 390 x 844',
        width: 390,
        height: 844,
      },
    ],
    recipeSlugs: [
      'auth',
      'onboarding',
      'pricing',
      'analytics',
      'file-manager',
      'safety',
      'admin-panel',
      ...QUICK_WIN_RECIPE_SLUGS,
    ],
  },
  'extension-saas': {
    id: 'extension-saas',
    href: '/extension-saas',
    navLabel: 'Extension SaaS',
    title: 'Extension SaaS template',
    eyebrow: 'templates/extension',
    summary:
      'A Chrome extension SaaS surface with a real popup, side panel, auth defaults, onboarding, dashboard actions, and settings.',
    sourceTemplate: 'templates/extension',
    defaultRouteId: 'dashboard',
    appRoutes: [
      {
        id: 'popup',
        label: 'Popup',
        path: 'popup',
        description: 'Compact popup account state and first action.',
        recipeSlug: 'auth',
        viewportLabel: 'Popup 380 x 600',
        width: 380,
        height: 600,
      },
      {
        id: 'onboarding',
        label: 'Onboarding',
        path: 'onboarding',
        description: 'Extension onboarding before the persistent side panel opens.',
        recipeSlug: 'onboarding',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: 'dashboard',
        description: 'Side-panel dashboard home with compact stats and next actions.',
        recipeSlug: 'dashboard-home',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'files',
        label: 'Files',
        path: 'files',
        description: 'Extension side-panel file upload and recent files.',
        recipeSlug: 'file-manager',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'teams',
        label: 'Teams',
        path: 'teams',
        description: 'Extension team role management with visible dropdowns.',
        recipeSlug: 'teams',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'billing',
        label: 'Billing',
        path: 'billing',
        description: 'Extension billing and plan upgrade route.',
        recipeSlug: 'pricing',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'settings',
        label: 'Settings',
        path: 'settings',
        description: 'Extension settings, feature flags, and safety controls.',
        recipeSlug: 'feature-flags',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        id: 'admin',
        label: 'Admin',
        path: 'admin',
        description: 'Side-panel owner console for support, billing risk, and audit review.',
        recipeSlug: 'admin-panel',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      ...templateRoutesForViewport(
        QUICK_WIN_TEMPLATE_ROUTE_SEEDS,
        'Side panel 430 x 760',
        430,
        760,
      ),
    ],
    routeStack: [
      {
        label: 'Popup',
        route: 'popup.html',
        description: 'Compact account status, onboarding progress, and primary action surface.',
      },
      {
        label: 'Side panel',
        route: 'sidepanel.html',
        description: 'Persistent workspace for chat, files, settings, and support workflows.',
      },
      {
        label: 'Background worker',
        route: 'background.ts',
        description: 'Chrome API bridge for alarms, side panel opening, and session handoff.',
      },
      {
        label: 'Settings',
        route: '/settings, /admin',
        description: 'Team, billing, language, notifications, feature flag, and admin controls.',
      },
    ],
    previews: [
      {
        label: 'Popup auth',
        description: 'Default popup entry state instead of a blank extension window.',
        slug: 'auth',
        viewportLabel: 'Popup 380 x 600',
        width: 380,
        height: 600,
      },
      {
        label: 'Side panel assistant',
        description: 'Dashboard-like assistant surface with upload and send controls.',
        slug: 'ai-assistant',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
      {
        label: 'Extension settings',
        description: 'Team and role controls for the signed-in extension workspace.',
        slug: 'teams',
        viewportLabel: 'Side panel 430 x 760',
        width: 430,
        height: 760,
      },
    ],
    recipeSlugs: [
      'auth',
      'onboarding',
      'ai-assistant',
      'file-manager',
      'teams',
      'feature-flags',
      'admin-panel',
      ...QUICK_WIN_RECIPE_SLUGS,
    ],
  },
};
