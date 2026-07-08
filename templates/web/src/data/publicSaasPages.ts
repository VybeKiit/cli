import type { SaasPageDefinition } from '@/data/saasPageTypes';

const PUBLIC_SAAS_PAGES: readonly SaasPageDefinition[] = [
  {
    slug: 'products',
    title: 'Product catalog',
    eyebrow: 'Commerce',
    summary: 'A generic ecommerce catalog with product cards, filters, inventory, and quick add.',
    primaryAction: { label: 'Add product', icon: 'package', variant: 'default' },
    secondaryAction: { label: 'View cart', icon: 'cart', variant: 'outline' },
    metrics: [
      { label: 'Products', value: '48', detail: '12 highlighted', icon: 'package' },
      { label: 'Conversion', value: '6.8%', detail: '+1.4% this week', icon: 'activity' },
      { label: 'Inventory', value: '91%', detail: 'Healthy stock', icon: 'archive' },
    ],
    mainItems: [
      {
        title: 'Starter kit license',
        description: 'Digital product card with pricing, feature bullets, and quick checkout.',
        meta: '$49 · Best seller',
      },
      {
        title: 'Design audit',
        description: 'Service product card with calendar handoff and customer notes.',
        meta: '$299 · Service',
      },
      {
        title: 'Template bundle',
        description: 'Bundled ecommerce item with upsell copy and variant labels.',
        meta: '$129 · Bundle',
      },
    ],
    asideItems: [
      {
        title: 'Filters',
        description: 'Category, price, stock, and rating controls.',
        meta: 'Ready',
      },
      {
        title: 'Card states',
        description: 'Sale, low stock, sold out, and featured states.',
        meta: '4 states',
      },
      {
        title: 'Checkout handoff',
        description: 'Cart and payment route links are visible.',
        meta: 'Connected',
      },
    ],
  },
  {
    slug: 'cart',
    title: 'Cart review',
    eyebrow: 'Commerce',
    summary: 'A cart page with line items, coupon handling, totals, and checkout handoff.',
    primaryAction: { label: 'Checkout', icon: 'credit-card', variant: 'default' },
    secondaryAction: { label: 'Keep shopping', icon: 'package', variant: 'outline' },
    metrics: [
      { label: 'Items', value: '3', detail: 'Ready to buy', icon: 'cart' },
      { label: 'Savings', value: '$24', detail: 'Launch coupon', icon: 'check' },
      { label: 'Total', value: '$154', detail: 'Before tax', icon: 'credit-card' },
    ],
    mainItems: [
      {
        title: 'Starter kit license',
        description: 'Commercial license with updates and support.',
        meta: '1 x $49',
      },
      {
        title: 'Template bundle',
        description: 'Website, mobile, and extension starter screens.',
        meta: '1 x $129',
      },
      { title: 'Discount', description: 'Launch coupon applied before checkout.', meta: '-$24' },
    ],
    asideItems: [
      { title: 'Coupon', description: 'Code field with success and error states.', meta: 'LAUNCH' },
      { title: 'Taxes', description: 'Placeholder for provider-calculated tax.', meta: 'Provider' },
      {
        title: 'Trust',
        description: 'Refund, support, and secure checkout copy.',
        meta: 'Visible',
      },
    ],
  },
  {
    slug: 'support',
    title: 'Support center',
    eyebrow: 'Help',
    summary: 'A support hub with docs search, tickets, contact cards, and status handoff.',
    primaryAction: { label: 'Create ticket', icon: 'life-buoy', variant: 'default' },
    secondaryAction: { label: 'Browse docs', icon: 'file', variant: 'outline' },
    metrics: [
      { label: 'Open tickets', value: '12', detail: '4 waiting on user', icon: 'life-buoy' },
      { label: 'Median reply', value: '18m', detail: 'Business hours', icon: 'activity' },
      { label: 'Docs coverage', value: '84%', detail: 'Top questions', icon: 'file' },
    ],
    mainItems: [
      {
        title: 'Billing question',
        description: 'Customer asks about plan upgrade and invoice date.',
        meta: 'Priority',
      },
      {
        title: 'Upload failed',
        description: 'File upload exceeded the current workspace limit.',
        meta: 'Needs reply',
      },
      {
        title: 'Account access',
        description: 'Recovery flow and session history are linked from the ticket.',
        meta: 'Security',
      },
    ],
    asideItems: [
      {
        title: 'Docs search',
        description: 'Search input and recommended articles.',
        meta: 'Ready',
      },
      {
        title: 'Contact options',
        description: 'Email, chat, phone, and callback cards.',
        meta: '4 channels',
      },
      {
        title: 'Status handoff',
        description: 'Incident links route to the status page.',
        meta: 'Linked',
      },
    ],
  },
  {
    slug: 'status',
    title: 'Service status',
    eyebrow: 'Public',
    summary: 'A public trust page with service health, incidents, uptime, and subscriptions.',
    primaryAction: { label: 'Subscribe', icon: 'bell', variant: 'default' },
    secondaryAction: { label: 'View history', icon: 'activity', variant: 'outline' },
    metrics: [
      { label: 'Overall', value: 'Operational', detail: 'All systems normal', icon: 'check' },
      { label: 'Uptime', value: '99.98%', detail: 'Last 90 days', icon: 'activity' },
      { label: 'Incidents', value: '0', detail: 'Current', icon: 'shield' },
    ],
    mainItems: [
      { title: 'API', description: 'Checkout, auth, and app API endpoints.', meta: 'Operational' },
      {
        title: 'Database',
        description: 'Primary database and read replicas.',
        meta: 'Operational',
      },
      { title: 'Email', description: 'Transactional messages and alerts.', meta: 'Operational' },
    ],
    asideItems: [
      {
        title: 'Incident timeline',
        description: 'Current and past incident updates.',
        meta: 'Clean',
      },
      {
        title: 'Subscriber alerts',
        description: 'Email, RSS, webhook, and in-app alerts.',
        meta: '918 users',
      },
      { title: 'Public copy', description: 'Plain-language status messages.', meta: 'Ready' },
    ],
  },
  {
    slug: 'changelog',
    title: 'Product changelog',
    eyebrow: 'Updates',
    summary: 'A release timeline with tags, impact labels, and subscription states.',
    primaryAction: { label: 'Subscribe', icon: 'bell', variant: 'default' },
    secondaryAction: { label: 'Read latest', icon: 'sparkles', variant: 'outline' },
    metrics: [
      { label: 'Releases', value: '18', detail: 'This quarter', icon: 'sparkles' },
      { label: 'Subscribers', value: '2.4k', detail: '+12% month over month', icon: 'users' },
      { label: 'Latest', value: 'v1.4', detail: 'Published today', icon: 'check' },
    ],
    mainItems: [
      {
        title: 'v1.4 SaaS template routes',
        description: 'Dashboard, settings, ecommerce, admin, and status screens.',
        meta: 'New',
      },
      {
        title: 'v1.3 Builder report mode',
        description: 'Visual bug reports with selector capture and screenshots.',
        meta: 'Improved',
      },
      {
        title: 'v1.2 Payment checkout',
        description: 'Practice checkout flow before provider keys are connected.',
        meta: 'Shipped',
      },
    ],
    asideItems: [
      {
        title: 'Release tags',
        description: 'New, improved, fixed, security, and deprecated.',
        meta: '5 tags',
      },
      {
        title: 'Newsletter',
        description: 'Subscribe form with loading and success states.',
        meta: 'Ready',
      },
      { title: 'RSS', description: 'Feed route placeholder for agents to wire.', meta: 'Planned' },
    ],
  },
  {
    slug: 'onboarding',
    title: 'Onboarding',
    eyebrow: 'Activation',
    summary: 'A post-signup setup flow before the user reaches the dashboard.',
    primaryAction: { label: 'Continue setup', icon: 'check', variant: 'default' },
    secondaryAction: { label: 'Skip for now', icon: 'settings', variant: 'outline' },
    metrics: [
      { label: 'Progress', value: '60%', detail: '3 of 5 steps', icon: 'activity' },
      { label: 'Workspace', value: 'Ready', detail: 'Profile seeded', icon: 'settings' },
      { label: 'Next', value: 'Invite team', detail: 'Recommended', icon: 'users' },
    ],
    mainItems: [
      {
        title: 'Create workspace',
        description: 'Name, logo, timezone, and owner details.',
        meta: 'Done',
      },
      {
        title: 'Invite teammates',
        description: 'Roles and invite links for first collaborators.',
        meta: 'Next',
      },
      {
        title: 'Connect payments',
        description: 'Practice checkout first, live provider later.',
        meta: 'Optional',
      },
    ],
    asideItems: [
      {
        title: 'Before dashboard',
        description: 'This route runs after signup.',
        meta: 'Correct order',
      },
      {
        title: 'Progress saved',
        description: 'Agents can wire this to user preferences.',
        meta: 'Ready',
      },
      {
        title: 'Plain language',
        description: 'No technical setup copy for builders.',
        meta: 'Clean',
      },
    ],
  },
] as const;

export { PUBLIC_SAAS_PAGES };
