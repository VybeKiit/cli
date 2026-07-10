import { PUBLIC_SAAS_PAGES } from '@/data/publicSaasPages';
import type { SaasPageDefinition } from '@/data/saasPageTypes';

const dashboardPublicSlugs = new Set(['products', 'cart', 'support', 'status', 'changelog']);

/**
 * Shell-only dashboard definitions (route maps for long-tail surfaces).
 * Tier-1 interactive pages live in `components/saas/*` and are not listed here.
 */
const DASHBOARD_SAAS_PAGES: readonly SaasPageDefinition[] = [
  {
    slug: 'teams',
    title: 'Team',
    eyebrow: 'Collaboration',
    summary: 'Interactive invite + member management (see TeamsPage feature surface).',
    primaryAction: { label: 'Invite teammate', icon: 'users', variant: 'default' },
    secondaryAction: { label: 'Manage roles', icon: 'shield', variant: 'outline' },
    metrics: [
      { label: 'Members', value: '3', detail: 'Practice seats', icon: 'users' },
      { label: 'Invites', value: '1', detail: 'Pending', icon: 'bell' },
      { label: 'Roles', value: '4', detail: 'Owner → Viewer', icon: 'shield' },
    ],
    mainItems: [
      {
        title: 'Feature page',
        description: 'Rendered by TeamsPage, not this shell definition.',
        meta: 'Interactive',
      },
    ],
    asideItems: [
      {
        title: 'Skill',
        description: 'Wire orgs with add-teams + organizations preset.',
        meta: 'add-teams',
      },
    ],
  },
  ...PUBLIC_SAAS_PAGES.filter(({ slug }) => dashboardPublicSlugs.has(slug)),
  {
    slug: 'orders',
    title: 'Orders',
    eyebrow: 'Commerce',
    summary: 'Interactive orders surface (see OrdersPage feature surface).',
    primaryAction: { label: 'Export orders', icon: 'file', variant: 'default' },
    secondaryAction: { label: 'Create refund', icon: 'credit-card', variant: 'outline' },
    metrics: [
      { label: 'Orders', value: '216', detail: 'This month', icon: 'cart' },
      { label: 'Fulfilled', value: '94%', detail: 'On time', icon: 'check' },
      { label: 'Revenue', value: '$18.4k', detail: '+9%', icon: 'credit-card' },
    ],
    mainItems: [
      {
        title: 'Feature page',
        description: 'Rendered by OrdersPage, not this shell definition.',
        meta: 'Interactive',
      },
    ],
    asideItems: [
      {
        title: 'Skill',
        description: 'Wire commerce via setup-payments + orders preset.',
        meta: 'setup-payments',
      },
    ],
  },
  {
    slug: 'integrations',
    title: 'Integrations',
    eyebrow: 'Connections',
    summary: 'Interactive integrations hub (see IntegrationsPage feature surface).',
    primaryAction: { label: 'Create API key', icon: 'plug', variant: 'default' },
    secondaryAction: { label: 'Test webhook', icon: 'activity', variant: 'outline' },
    metrics: [
      { label: 'Connected', value: '7', detail: 'Active tools', icon: 'plug' },
      { label: 'Webhooks', value: '14k', detail: 'Events this week', icon: 'activity' },
      { label: 'Failures', value: '2', detail: 'Retry queue', icon: 'shield' },
    ],
    mainItems: [
      {
        title: 'Feature page',
        description: 'Rendered by IntegrationsPage, not this shell definition.',
        meta: 'Interactive',
      },
    ],
    asideItems: [
      {
        title: 'API keys',
        description: 'Create, reveal once, rotate, and revoke.',
        meta: 'Secure',
      },
      {
        title: 'Webhook logs',
        description: 'Delivery attempts and retry controls.',
        meta: 'Visible',
      },
    ],
  },
  {
    slug: 'admin',
    title: 'Admin command center',
    eyebrow: 'Admin',
    summary:
      'Owner control center for users, billing risk, support, audit events, and system health.',
    primaryAction: { label: 'Review queue', icon: 'shield', variant: 'default' },
    secondaryAction: { label: 'Invite admin', icon: 'users', variant: 'outline' },
    metrics: [
      { label: 'Users', value: '1,284', detail: '+18 this week', icon: 'users' },
      { label: 'Billing risk', value: '$840', detail: '3 failed renewals', icon: 'credit-card' },
      { label: 'System', value: 'Healthy', detail: 'No incidents', icon: 'activity' },
    ],
    mainItems: [
      {
        title: 'User review',
        description: 'Suspicious login and account recovery queue.',
        meta: '4 items',
      },
      {
        title: 'Billing risk',
        description: 'Failed payments, retries, credits, and invoices.',
        meta: '3 accounts',
      },
      {
        title: 'Audit log',
        description: 'Permission, role, support, and billing events.',
        meta: 'Live',
      },
    ],
    asideItems: [
      {
        title: 'Role permissions',
        description: 'Owner, admin, support, finance, and viewer.',
        meta: 'Matrix',
      },
      {
        title: 'System health',
        description: 'API, queues, cron jobs, storage, and email.',
        meta: 'Healthy',
      },
      {
        title: 'Support escalations',
        description: 'VIP tickets and SLA warnings.',
        meta: '2 open',
      },
    ],
  },
] as const;

export { DASHBOARD_SAAS_PAGES };
