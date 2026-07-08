import { PUBLIC_SAAS_PAGES } from '@/data/publicSaasPages';
import type { SaasPageDefinition } from '@/data/saasPageTypes';

const dashboardPublicSlugs = new Set(['products', 'cart', 'support', 'status', 'changelog']);

const DASHBOARD_SAAS_PAGES: readonly SaasPageDefinition[] = [
  {
    slug: 'dashboard',
    title: 'Dashboard',
    eyebrow: 'Overview',
    summary:
      'A signed-in home screen with business health, next actions, onboarding, and recent activity.',
    primaryAction: { label: 'Create workflow', icon: 'sparkles', variant: 'default' },
    secondaryAction: { label: 'View settings', icon: 'settings', variant: 'outline' },
    metrics: [
      { label: 'Revenue', value: '$18.4k', detail: '+9% from last month', icon: 'credit-card' },
      { label: 'Customers', value: '1,284', detail: '+18 this week', icon: 'users' },
      { label: 'Tasks', value: '24', detail: '7 due today', icon: 'kanban' },
    ],
    mainItems: [
      {
        title: 'Launch checklist',
        description: 'Payments, auth, domain, and email are visible.',
        meta: '4 steps',
      },
      {
        title: 'Recent activity',
        description: 'Orders, support, sign-ins, and admin events.',
        meta: 'Live feed',
      },
      {
        title: 'Builder handoff',
        description: 'Plain-language next actions for your AI agent.',
        meta: 'Ready',
      },
    ],
    asideItems: [
      {
        title: 'Onboarding',
        description: 'Runs after signup before this dashboard.',
        meta: 'Linked',
      },
      {
        title: 'Walkthrough',
        description: 'Tutorial prompts can start from this route.',
        meta: 'Prepared',
      },
      {
        title: 'Responsive shell',
        description: 'Sidebar routes stay available on desktop and mobile.',
        meta: 'Ready',
      },
    ],
  },
  {
    slug: 'settings',
    title: 'User settings',
    eyebrow: 'Account',
    summary:
      'Profile, security, sessions, notifications, connected accounts, and danger-zone controls.',
    primaryAction: { label: 'Save changes', icon: 'settings', variant: 'default' },
    secondaryAction: { label: 'Review security', icon: 'shield', variant: 'outline' },
    metrics: [
      { label: 'Profile', value: 'Complete', detail: 'Owner details saved', icon: 'check' },
      { label: 'Sessions', value: '3', detail: '2 trusted devices', icon: 'shield' },
      { label: 'Alerts', value: '8', detail: 'Notification channels', icon: 'bell' },
    ],
    mainItems: [
      {
        title: 'Profile',
        description: 'Name, email, avatar, timezone, and locale.',
        meta: 'Editable',
      },
      {
        title: 'Security',
        description: 'Password, two-factor, recovery codes, and sessions.',
        meta: 'Important',
      },
      {
        title: 'Notifications',
        description: 'Email, push, digest, and billing alerts.',
        meta: 'Granular',
      },
    ],
    asideItems: [
      {
        title: 'Connected accounts',
        description: 'Google, GitHub, Slack, and API keys.',
        meta: '4 providers',
      },
      {
        title: 'Danger zone',
        description: 'Export data, transfer ownership, delete account.',
        meta: 'Guarded',
      },
      {
        title: 'Audit trail',
        description: 'Recent profile and security changes.',
        meta: 'Visible',
      },
    ],
  },
  ...PUBLIC_SAAS_PAGES.filter(({ slug }) => dashboardPublicSlugs.has(slug)),
  {
    slug: 'orders',
    title: 'Orders',
    eyebrow: 'Commerce',
    summary: 'Order history, fulfillment states, invoices, tracking, refunds, and reorders.',
    primaryAction: { label: 'Export orders', icon: 'file', variant: 'default' },
    secondaryAction: { label: 'Create refund', icon: 'credit-card', variant: 'outline' },
    metrics: [
      { label: 'Orders', value: '216', detail: 'This month', icon: 'cart' },
      { label: 'Fulfilled', value: '94%', detail: 'On time', icon: 'check' },
      { label: 'Revenue', value: '$18.4k', detail: '+9%', icon: 'credit-card' },
    ],
    mainItems: [
      {
        title: 'Order #1048',
        description: 'Template bundle, paid, awaiting license email.',
        meta: 'Paid',
      },
      { title: 'Order #1047', description: 'Design audit booked for Friday.', meta: 'Scheduled' },
      { title: 'Order #1046', description: 'Starter kit license delivered.', meta: 'Complete' },
    ],
    asideItems: [
      {
        title: 'Filters',
        description: 'Status, customer, date, product, and fulfillment.',
        meta: 'Ready',
      },
      { title: 'Invoices', description: 'Download and resend invoice controls.', meta: 'Visible' },
      { title: 'Refunds', description: 'Guarded refund and cancellation actions.', meta: 'Safe' },
    ],
  },
  {
    slug: 'integrations',
    title: 'Integrations',
    eyebrow: 'Connections',
    summary: 'API keys, webhooks, OAuth apps, analytics, CRM, and automation tools.',
    primaryAction: { label: 'Create API key', icon: 'plug', variant: 'default' },
    secondaryAction: { label: 'Test webhook', icon: 'activity', variant: 'outline' },
    metrics: [
      { label: 'Connected', value: '7', detail: 'Active tools', icon: 'plug' },
      { label: 'Webhooks', value: '14k', detail: 'Events this week', icon: 'activity' },
      { label: 'Failures', value: '2', detail: 'Retry queue', icon: 'shield' },
    ],
    mainItems: [
      {
        title: 'Stripe',
        description: 'Checkout, invoices, subscriptions, and tax.',
        meta: 'Connected',
      },
      { title: 'PostHog', description: 'Product analytics and visitor stats.', meta: 'Connected' },
      { title: 'Slack', description: 'Incident, order, and support notifications.', meta: 'Ready' },
    ],
    asideItems: [
      {
        title: 'API keys',
        description: 'Create, reveal once, rotate, and revoke.',
        meta: 'Secure',
      },
      {
        title: 'OAuth apps',
        description: 'Client id, scopes, callbacks, and consent.',
        meta: 'Ready',
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
