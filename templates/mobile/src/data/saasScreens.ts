/** One metric on a mobile SaaS screen. */
export interface MobileSaasMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

/** One list item on a mobile SaaS screen. */
export interface MobileSaasItem {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
}

/** One mobile SaaS screen definition. */
export interface MobileSaasScreen {
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly primaryLabel: string;
  readonly primaryIcon: string;
  readonly secondaryLabel: string;
  readonly secondaryIcon: string;
  readonly metrics: readonly MobileSaasMetric[];
  readonly items: readonly MobileSaasItem[];
  readonly checklist: readonly MobileSaasItem[];
}

/** Mobile app routes that ship ready for customization. */
export const MOBILE_SAAS_SCREENS: readonly MobileSaasScreen[] = [
  {
    slug: 'onboarding',
    title: 'Onboarding',
    eyebrow: 'Activation',
    summary: 'Post-signup setup before the user reaches the dashboard.',
    primaryLabel: 'Continue setup',
    primaryIcon: '+',
    secondaryLabel: 'Skip for now',
    secondaryIcon: '>',
    metrics: [
      { label: 'Progress', value: '60%', detail: '3 of 5 steps' },
      { label: 'Workspace', value: 'Ready', detail: 'Profile seeded' },
      { label: 'Next', value: 'Invite', detail: 'Recommended' },
    ],
    items: [
      { title: 'Create workspace', description: 'Name, logo, timezone, and owner.', meta: 'Done' },
      { title: 'Invite teammates', description: 'Roles and invite links.', meta: 'Next' },
      { title: 'Connect payments', description: 'Practice checkout first.', meta: 'Optional' },
    ],
    checklist: [
      {
        title: 'Runs after signup',
        description: 'Before the first dashboard visit.',
        meta: 'Correct',
      },
      { title: 'Progress saved', description: 'Ready for user preference storage.', meta: 'Ready' },
    ],
  },
  {
    slug: 'settings',
    title: 'User settings',
    eyebrow: 'Account',
    summary: 'Profile, security, sessions, notifications, and connected accounts.',
    primaryLabel: 'Save changes',
    primaryIcon: '*',
    secondaryLabel: 'Security',
    secondaryIcon: '!',
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
    checklist: [
      {
        title: 'Danger zone',
        description: 'Export, transfer, and delete actions.',
        meta: 'Guarded',
      },
      {
        title: 'Audit trail',
        description: 'Recent security and profile changes.',
        meta: 'Visible',
      },
    ],
  },
  {
    slug: 'products',
    title: 'Product catalog',
    eyebrow: 'Commerce',
    summary: 'Product cards, filters, inventory, and quick-add states.',
    primaryLabel: 'Add product',
    primaryIcon: '+',
    secondaryLabel: 'View cart',
    secondaryIcon: '>',
    metrics: [
      { label: 'Products', value: '48', detail: '12 highlighted' },
      { label: 'Conversion', value: '6.8%', detail: '+1.4% this week' },
      { label: 'Inventory', value: '91%', detail: 'Healthy stock' },
    ],
    items: [
      {
        title: 'Starter kit license',
        description: 'Digital card with pricing and checkout.',
        meta: '$49',
      },
      { title: 'Design audit', description: 'Service card with calendar handoff.', meta: '$299' },
      { title: 'Template bundle', description: 'Bundle card with upsell copy.', meta: '$129' },
    ],
    checklist: [
      { title: 'Filters', description: 'Category, price, stock, and rating.', meta: 'Ready' },
      {
        title: 'Card states',
        description: 'Sale, low stock, sold out, featured.',
        meta: '4 states',
      },
    ],
  },
  {
    slug: 'orders',
    title: 'Orders',
    eyebrow: 'Commerce',
    summary: 'Order history, fulfillment, invoices, tracking, and refunds.',
    primaryLabel: 'Export orders',
    primaryIcon: 'v',
    secondaryLabel: 'Refund',
    secondaryIcon: '!',
    metrics: [
      { label: 'Orders', value: '216', detail: 'This month' },
      { label: 'Fulfilled', value: '94%', detail: 'On time' },
      { label: 'Revenue', value: '$18.4k', detail: '+9%' },
    ],
    items: [
      {
        title: 'Order #1048',
        description: 'Template bundle awaiting license email.',
        meta: 'Paid',
      },
      { title: 'Order #1047', description: 'Design audit booked for Friday.', meta: 'Scheduled' },
      { title: 'Order #1046', description: 'Starter kit license delivered.', meta: 'Complete' },
    ],
    checklist: [
      { title: 'Invoices', description: 'Download and resend controls.', meta: 'Visible' },
      { title: 'Refunds', description: 'Guarded refund and cancellation actions.', meta: 'Safe' },
    ],
  },
  {
    slug: 'status',
    title: 'Service status',
    eyebrow: 'Public',
    summary: 'Service health, uptime, incidents, and subscriber alerts.',
    primaryLabel: 'Subscribe',
    primaryIcon: '+',
    secondaryLabel: 'History',
    secondaryIcon: '>',
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
    checklist: [
      {
        title: 'Subscribers',
        description: 'Email, RSS, webhook, and in-app alerts.',
        meta: 'Ready',
      },
      {
        title: 'Incident timeline',
        description: 'Current and past incident updates.',
        meta: 'Clean',
      },
    ],
  },
  {
    slug: 'changelog',
    title: 'Product changelog',
    eyebrow: 'Updates',
    summary: 'Release timeline with tags, impact labels, and subscription states.',
    primaryLabel: 'Subscribe',
    primaryIcon: '+',
    secondaryLabel: 'Read latest',
    secondaryIcon: '>',
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
    checklist: [
      { title: 'Release tags', description: 'New, improved, fixed, security.', meta: 'Ready' },
      { title: 'Newsletter', description: 'Subscribe form states are visible.', meta: 'Ready' },
    ],
  },
];

const screensBySlug: Readonly<Record<string, MobileSaasScreen>> = Object.fromEntries(
  MOBILE_SAAS_SCREENS.map((screen) => [screen.slug, screen]),
);

/**
 * Find a mobile SaaS screen by route slug.
 *
 * @param slug - Expo route segment.
 * @returns The matching screen, or undefined when the route is unknown.
 * @example
 * const screen = getMobileSaasScreen('settings');
 */
export const getMobileSaasScreen = (slug: string): MobileSaasScreen | undefined => {
  const screen = screensBySlug[slug];
  if (screen === undefined) {
    return;
  }
  return screen;
};
