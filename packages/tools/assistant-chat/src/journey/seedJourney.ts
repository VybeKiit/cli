import type { Journey, JourneyDomain, JourneyStep } from './types';

const step = (
  id: string,
  label: string,
  description: string,
  toolHints: readonly string[],
): JourneyStep => ({
  id,
  label,
  description,
  status: 'pending',
  toolHints,
});

const AUTH_STEPS: readonly JourneyStep[] = [
  step('auth-detect', 'Read your sign-in goal', 'Figure out email, Google, or phone.', [
    'auth',
    'signin',
    'sign-in',
  ]),
  step('auth-provider', 'Wire the sign-in provider', 'Connect Google / email / phone.', [
    'oauth',
    'google',
    'better-auth',
    'browser',
  ]),
  step('auth-pages', 'Build the sign-in screens', 'Sign up, sign in, reset password.', [
    'page',
    'route',
    'write',
  ]),
  step('auth-verify', 'Check it works', 'Open the flow and confirm a real sign-in.', [
    'verify',
    'test',
    'browser',
  ]),
];

/** Shared data steps + ready-feature checks for Neon / Supabase / D1 presets. */
const DATABASE_STEPS: readonly JourneyStep[] = [
  step('db-choose', 'Pick where data lives', 'Neon, Supabase, Cloudflare D1, or AWS.', [
    'neon',
    'supabase',
    'd1',
    'database',
    'railway',
  ]),
  step('db-schema', 'Design what to remember', 'Tables and fields for your product.', [
    'schema',
    'migration',
    'sql',
  ]),
  step('db-wire', 'Connect the app', 'Env keys + read/write helpers (values stay private).', [
    'env',
    'connect',
    'client',
  ]),
  step('db-ready-check', 'Ready-feature check', 'Confirm CRUD helpers and health query pass.', [
    'ready',
    'health',
    'doctor',
    'preset',
  ]),
  step('db-verify', 'Save and read back', 'Prove a row can be written and loaded.', [
    'query',
    'verify',
    'test',
    'crud',
  ]),
];

const PAYMENTS_STEPS: readonly JourneyStep[] = [
  step('pay-provider', 'Pick how you take money', 'Lemon Squeezy, Stripe, or PayPal.', [
    'payment',
    'stripe',
    'lemon',
    'paypal',
  ]),
  step('pay-checkout', 'Build checkout', 'Product, price, hosted checkout link.', [
    'checkout',
    'product',
    'price',
  ]),
  step('pay-webhook', 'Listen for paid events', 'Webhook → unlock access.', ['webhook', 'fulfill']),
  step('pay-verify', 'Test a purchase', 'Run a test payment end to end.', [
    'verify',
    'test',
    'browser',
  ]),
];

const DEPLOY_STEPS: readonly JourneyStep[] = [
  step('deploy-target', 'Pick where it goes live', 'Cloudflare, Vercel, Render, Railway, or AWS.', [
    'deploy',
    'wrangler',
    'vercel',
    'render',
    'railway',
    'pages',
  ]),
  step('deploy-artifact', 'Prepare index.html', 'Ship a basic page the host can serve.', [
    'index.html',
    'html',
    'write',
    'asset',
  ]),
  step('deploy-env', 'Set live settings', 'URL, secrets, and project name (values stay private).', [
    'env',
    'secret',
    'config',
  ]),
  step('deploy-ship', 'Put the app online', 'Build and publish the live address.', [
    'deploy',
    'publish',
    'build',
    'wrangler',
  ]),
  step('deploy-verify', 'Open the live URL', 'Confirm the site loads for real.', [
    'verify',
    'curl',
    'browser',
    'http',
  ]),
];

const CRUD_STEPS: readonly JourneyStep[] = [
  step('crud-resource', 'Name the thing to remember', 'Orders, posts, customers, …', [
    'resource',
    'model',
    'entity',
  ]),
  step('crud-create', 'Create', 'Add a new record from the app.', ['create', 'insert', 'post']),
  step('crud-read', 'Read', 'List and open a single record.', ['read', 'list', 'get', 'select']),
  step('crud-update', 'Update', 'Edit fields and save.', ['update', 'patch', 'put']),
  step('crud-delete', 'Delete', 'Remove a record safely.', ['delete', 'remove']),
  step('crud-verify', 'Ready check', 'Walk create → read → update → delete once.', [
    'verify',
    'test',
    'e2e',
    'ready',
  ]),
];

const DOMAIN_META: Record<
  JourneyDomain,
  {
    readonly title: (params: Readonly<Record<string, string>>) => string;
    readonly skillIntent: (params: Readonly<Record<string, string>>) => string;
    readonly steps: readonly JourneyStep[];
  }
> = {
  auth: {
    title: (p) => (p.provider === 'google' ? 'Sign in with Google' : 'Add sign-in for your people'),
    skillIntent: (p) => {
      if (p.provider === 'google') return 'sign-in-with-google';
      if (p.provider === 'phone') return 'sign-in-with-phone';
      return 'add-signin';
    },
    steps: AUTH_STEPS,
  },
  database: {
    title: (p) =>
      p.provider ? `Save data on ${p.provider}` : 'Save data so the app remembers things',
    skillIntent: (p) => {
      if (p.provider === 'neon') return 'neon';
      if (p.provider === 'supabase') return 'supabase';
      if (p.provider === 'cloudflare d1') return 'wrangler';
      return 'save-data';
    },
    steps: DATABASE_STEPS,
  },
  payments: {
    title: (p) => (p.provider ? `Take money with ${p.provider}` : 'Take real money from customers'),
    skillIntent: () => 'setup-payments',
    steps: PAYMENTS_STEPS,
  },
  deploy: {
    title: (p) => {
      if (p.artifact === 'index.html' && p.provider) {
        return `Deploy index.html to ${p.provider}`;
      }
      return p.provider ? `Go live on ${p.provider}` : 'Put the app online';
    },
    skillIntent: (p) => {
      if (p.provider === 'cloudflare') return 'wrangler';
      if (p.provider === 'railway') return 'use-railway';
      return 'go-live';
    },
    steps: DEPLOY_STEPS,
  },
  crud: {
    title: (p) =>
      p.resource ? `CRUD for ${p.resource}` : 'Create, read, update, and delete records',
    skillIntent: () => 'add-crud',
    steps: CRUD_STEPS,
  },
};

/**
 * Build a fresh pending journey for a domain with optional params.
 *
 * @param domain - Journey domain.
 * @param params - Extracted providers / hosts from the user message.
 * @returns A pending journey ready for the rail.
 * @example
 * seedJourney('auth', { provider: 'google' });
 */
export const seedJourney = (
  domain: JourneyDomain,
  params: Readonly<Record<string, string>> = {},
): Journey => {
  const meta = DOMAIN_META[domain];
  return {
    id: `${domain}-${Date.now()}`,
    domain,
    title: meta.title(params),
    skillIntent: meta.skillIntent(params),
    params,
    steps: meta.steps.map((s) => ({ ...s, status: 'pending' as const })),
  };
};
