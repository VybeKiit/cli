/** One metric on an extension SaaS screen. */
export interface ExtensionSaasMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

/** One content row on an extension SaaS screen. */
export interface ExtensionSaasItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
}

/** One extension SaaS view definition. */
export interface ExtensionSaasScreen {
  readonly view: ExtensionView;
  readonly navLabel: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly metrics: readonly ExtensionSaasMetric[];
  readonly items: readonly ExtensionSaasItem[];
}

/** Side-panel SaaS screens that ship with the extension template. */
export const EXTENSION_SAAS_SCREENS: readonly ExtensionSaasScreen[] = [
  {
    view: 'dashboard',
    navLabel: 'Dashboard',
    title: 'Dashboard',
    eyebrow: 'Overview',
    summary: 'Compact side-panel home with health, next actions, and recent activity.',
    primaryLabel: 'Create workflow',
    secondaryLabel: 'Open settings',
    metrics: [
      { label: 'Revenue', value: '$18.4k', detail: '+9% this month' },
      { label: 'Customers', value: '1,284', detail: '+18 this week' },
      { label: 'Tasks', value: '24', detail: '7 due today' },
    ],
    items: [
      {
        title: 'Launch checklist',
        description: 'Payments, auth, domain, and email.',
        meta: '4 steps',
      },
      {
        title: 'Recent activity',
        description: 'Orders, support, sign-ins, and admin events.',
        meta: 'Live',
      },
      {
        title: 'Builder handoff',
        description: 'Plain-language next actions for the agent.',
        meta: 'Ready',
      },
    ],
  },
  {
    view: 'products',
    navLabel: 'Products',
    title: 'Product catalog',
    eyebrow: 'Commerce',
    summary: 'Product cards, filters, inventory, and quick-add states in the side panel.',
    primaryLabel: 'Add product',
    secondaryLabel: 'View cart',
    metrics: [
      { label: 'Products', value: '48', detail: '12 highlighted' },
      { label: 'Conversion', value: '6.8%', detail: '+1.4% this week' },
      { label: 'Inventory', value: '91%', detail: 'Healthy stock' },
    ],
    items: [
      { title: 'Starter kit license', description: 'Digital product with checkout.', meta: '$49' },
      {
        title: 'Design audit',
        description: 'Service product with calendar handoff.',
        meta: '$299',
      },
      { title: 'Template bundle', description: 'Bundle with upsell copy.', meta: '$129' },
    ],
  },
  {
    view: 'settings',
    navLabel: 'User settings',
    title: 'User settings',
    eyebrow: 'Account',
    summary: 'Profile, sessions, notifications, connected accounts, and guarded actions.',
    primaryLabel: 'Save changes',
    secondaryLabel: 'Security',
    metrics: [
      { label: 'Profile', value: 'Complete', detail: 'Owner details saved' },
      { label: 'Sessions', value: '3', detail: '2 trusted devices' },
      { label: 'Alerts', value: '8', detail: 'Notification channels' },
    ],
    items: [
      {
        title: 'Profile',
        description: 'Name, email, avatar, locale, and timezone.',
        meta: 'Editable',
      },
      {
        title: 'Security',
        description: 'Password, two-factor, recovery, and sessions.',
        meta: 'Important',
      },
      {
        title: 'Notifications',
        description: 'Email, push, digest, and billing alerts.',
        meta: 'Granular',
      },
    ],
  },
  {
    view: 'status',
    navLabel: 'Status',
    title: 'Service status',
    eyebrow: 'Public',
    summary: 'Service health, uptime, incidents, and subscriber alerts.',
    primaryLabel: 'Subscribe',
    secondaryLabel: 'History',
    metrics: [
      { label: 'Overall', value: 'Operational', detail: 'All systems normal' },
      { label: 'Uptime', value: '99.98%', detail: 'Last 90 days' },
      { label: 'Incidents', value: '0', detail: 'Current' },
    ],
    items: [
      { title: 'API', description: 'Checkout, auth, and app API endpoints.', meta: 'Operational' },
      {
        title: 'Database',
        description: 'Primary database and read replicas.',
        meta: 'Operational',
      },
      { title: 'Email', description: 'Transactional messages and alerts.', meta: 'Operational' },
    ],
  },
  {
    view: 'changelog',
    navLabel: 'Changelog',
    title: 'Product changelog',
    eyebrow: 'Updates',
    summary: 'Release timeline with tags, impact labels, and subscription states.',
    primaryLabel: 'Subscribe',
    secondaryLabel: 'Read latest',
    metrics: [
      { label: 'Releases', value: '18', detail: 'This quarter' },
      { label: 'Subscribers', value: '2.4k', detail: '+12% month over month' },
      { label: 'Latest', value: 'v1.4', detail: 'Published today' },
    ],
    items: [
      {
        title: 'v1.4 SaaS template routes',
        description: 'Dashboard, settings, ecommerce, admin.',
        meta: 'New',
      },
      {
        title: 'v1.3 Report mode',
        description: 'Visual bug reports and selector capture.',
        meta: 'Improved',
      },
      {
        title: 'v1.2 Checkout',
        description: 'Practice checkout before live provider keys.',
        meta: 'Shipped',
      },
    ],
  },
  {
    view: 'admin',
    navLabel: 'Admin',
    title: 'Admin command center',
    eyebrow: 'Admin',
    summary: 'Owner controls for users, billing risk, support, audit, and system health.',
    primaryLabel: 'Review queue',
    secondaryLabel: 'Invite admin',
    metrics: [
      { label: 'Users', value: '1,284', detail: '+18 this week' },
      { label: 'Billing risk', value: '$840', detail: '3 failed renewals' },
      { label: 'System', value: 'Healthy', detail: 'No incidents' },
    ],
    items: [
      {
        title: 'User review',
        description: 'Suspicious login and recovery queue.',
        meta: '4 items',
      },
      {
        title: 'Billing risk',
        description: 'Failed payments, retries, credits, invoices.',
        meta: '3 accounts',
      },
      {
        title: 'Audit log',
        description: 'Permission, role, support, and billing events.',
        meta: 'Live',
      },
    ],
  },
];

const screensByView: Readonly<Record<string, ExtensionSaasScreen>> = Object.fromEntries(
  EXTENSION_SAAS_SCREENS.map((screen) => [screen.view, screen]),
);

/**
 * Find an extension SaaS screen by view id.
 *
 * @param view - Extension view id from the local router.
 * @returns The matching SaaS screen, or undefined when the view is unknown.
 * @example
 * const screen = getExtensionSaasScreen('dashboard');
 */
export const getExtensionSaasScreen = (view: string): ExtensionSaasScreen | undefined => {
  const screen = screensByView[view];
  if (screen === undefined) {
    return;
  }
  return screen;
};
import type { ExtensionView } from '@/lib/view';
