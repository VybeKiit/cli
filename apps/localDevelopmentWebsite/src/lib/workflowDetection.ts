import type { Workflow, WorkflowStep } from './workflows';

type StepTemplate = {
  keywords: string[];
  step: WorkflowStep;
};

/** Provider tokens scanned from the user message (first match wins per group). */
const PROVIDER_HINTS: ReadonlyArray<{
  readonly keys: readonly string[];
  readonly value: string;
  readonly stepIds: readonly string[];
}> = [
  { keys: ['neon'], value: 'neon', stepIds: ['database'] },
  { keys: ['supabase'], value: 'supabase', stepIds: ['database'] },
  { keys: ['planetscale'], value: 'planetscale', stepIds: ['database'] },
  { keys: ['mongodb', 'mongo'], value: 'mongodb', stepIds: ['database'] },
  { keys: ['d1'], value: 'cloudflare d1', stepIds: ['database'] },
  { keys: ['stripe'], value: 'stripe', stepIds: ['payment', 'billing'] },
  {
    keys: ['lemon squeezy', 'lemonsqueezy', 'lemon'],
    value: 'lemon squeezy',
    stepIds: ['payment', 'billing'],
  },
  { keys: ['paypal'], value: 'paypal', stepIds: ['payment', 'billing'] },
  { keys: ['orders', 'order'], value: 'lemon squeezy', stepIds: ['payment', 'billing'] },
  { keys: ['google'], value: 'google', stepIds: ['auth', 'oauth'] },
  { keys: ['cloudflare', 'workers', 'pages'], value: 'cloudflare', stepIds: ['deploy'] },
  { keys: ['vercel'], value: 'vercel', stepIds: ['deploy'] },
  { keys: ['render'], value: 'render', stepIds: ['deploy'] },
  { keys: ['railway'], value: 'railway', stepIds: ['deploy'] },
  { keys: ['aws'], value: 'aws', stepIds: ['deploy'] },
];

const STEP_DOMAIN: Record<string, NonNullable<WorkflowStep['domain']>> = {
  auth: 'auth',
  oauth: 'auth',
  database: 'database',
  payment: 'payments',
  billing: 'payments',
  deploy: 'deploy',
};

/**
 * Attach provider + domain brand metadata for dynamic logos.
 *
 * @param step - Template step clone.
 * @param lower - Lowercased user message.
 * @returns Step with provider/domain when resolvable.
 */
const withActionBrand = (step: WorkflowStep, lower: string): WorkflowStep => {
  const domain = STEP_DOMAIN[step.id];
  let provider: string | undefined;
  for (const hint of PROVIDER_HINTS) {
    if (!hint.stepIds.includes(step.id)) {
      continue;
    }
    if (hint.keys.some((k) => lower.includes(k))) {
      provider = hint.value;
      break;
    }
  }
  // Kit defaults when the step domain is known but no provider was named.
  if (provider === undefined && domain === 'payments') {
    provider = 'lemon squeezy';
  }
  if (provider === undefined && domain === 'database') {
    provider = 'neon';
  }
  if (provider === undefined && domain === 'deploy') {
    provider = 'cloudflare';
  }
  if (provider === undefined && domain === 'auth') {
    provider = 'google';
  }

  return {
    ...step,
    ...(domain === undefined ? {} : { domain }),
    ...(provider === undefined ? {} : { provider }),
    ...(step.subSteps === undefined
      ? {}
      : {
          subSteps: step.subSteps.map((sub) => ({
            ...sub,
            ...(domain === undefined ? {} : { domain }),
            ...(provider === undefined ? {} : { provider }),
          })),
        }),
  };
};

const STEP_TEMPLATES: StepTemplate[] = [
  {
    keywords: ['scaffold', 'project', 'setup', 'create', 'init', 'start'],
    step: {
      id: 'scaffold',
      label: 'Scaffold the project',
      description: 'Create repo, install dependencies, set up tooling.',
      status: 'pending',
    },
  },
  {
    keywords: ['landing', 'landing page', 'hero', 'homepage'],
    step: {
      id: 'landing',
      label: 'Landing page',
      description: 'Hero section, features grid, email capture.',
      status: 'pending',
    },
  },
  {
    keywords: ['terms', 'terms of service', 'tos'],
    step: {
      id: 'terms',
      label: 'Terms of service',
      description: 'Generate legal terms page.',
      status: 'pending',
    },
  },
  {
    keywords: ['privacy', 'privacy policy', 'gdpr'],
    step: {
      id: 'privacy',
      label: 'Privacy policy',
      description: 'Generate privacy policy page.',
      status: 'pending',
    },
  },
  {
    keywords: ['dashboard', 'admin', 'panel', 'overview'],
    step: {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Main app layout, navigation, overview.',
      status: 'pending',
    },
  },
  {
    keywords: ['billing', 'invoice', 'subscription management', 'usage'],
    step: {
      id: 'billing',
      label: 'Billing',
      description: 'Subscription management, invoices, usage.',
      status: 'pending',
    },
  },
  {
    keywords: ['settings', 'preferences', 'profile', 'account settings'],
    step: {
      id: 'settings',
      label: 'Settings',
      description: 'Account settings, profile, preferences.',
      status: 'pending',
    },
  },
  {
    keywords: ['auth', 'login', 'sign in', 'sign up', 'register', 'password'],
    step: {
      id: 'auth',
      label: 'Add authentication',
      description: 'Sign up, sign in, forgot password flow.',
      status: 'pending',
      subSteps: [
        {
          id: 'auth-signup',
          label: 'Sign up page',
          description: 'Email + password registration.',
          status: 'pending',
        },
        {
          id: 'auth-signin',
          label: 'Sign in page',
          description: 'Session-based login.',
          status: 'pending',
        },
        {
          id: 'auth-google',
          label: 'Google sign-in',
          description: 'OAuth via Better Auth.',
          status: 'pending',
        },
        {
          id: 'auth-otp',
          label: 'Forgot password OTP',
          description: 'Email one-time passcode reset.',
          status: 'pending',
        },
      ],
    },
  },
  {
    keywords: ['google', 'oauth', 'social login', 'google sign'],
    step: {
      id: 'oauth',
      label: 'Google OAuth',
      description: 'Social sign-in via Google.',
      status: 'pending',
      subSteps: [
        {
          id: 'auth-google',
          label: 'Google sign-in',
          description: 'OAuth consent + callback.',
          status: 'pending',
        },
      ],
    },
  },
  {
    keywords: [
      'database',
      'db',
      'schema',
      'migration',
      'postgres',
      'mysql',
      'supabase',
      'neon',
      'ready feature',
      'ready check',
      'save data',
    ],
    step: {
      id: 'database',
      label: 'Wire the database',
      description: 'Schema, migrations, seed data, ready-feature checks.',
      status: 'pending',
    },
  },
  {
    keywords: ['payment', 'stripe', 'checkout', 'paypal', 'lemon squeezy', 'take money'],
    step: {
      id: 'payment',
      label: 'Enable payments',
      description: 'Stripe, PayPal, Lemon Squeezy — checkout, webhooks, portal.',
      status: 'pending',
    },
  },
  {
    keywords: [
      'deploy',
      'live',
      'ship',
      'production',
      'cloudflare',
      'vercel',
      'render',
      'railway',
      'pages',
    ],
    step: {
      id: 'deploy',
      label: 'Go live',
      description: 'Deploy to production.',
      status: 'pending',
    },
  },

  {
    keywords: ['extension', 'chrome extension', 'browser extension'],
    step: {
      id: 'extension',
      label: 'Build browser extension',
      description: 'Manifest, popup, content script.',
      status: 'pending',
    },
  },
  {
    keywords: ['app', 'mobile', 'native', 'expo', 'react native'],
    step: {
      id: 'app',
      label: 'Build mobile app',
      description: 'Expo setup, screens, navigation.',
      status: 'pending',
    },
  },
  {
    keywords: ['website', 'web app', 'site', 'frontend'],
    step: {
      id: 'website',
      label: 'Build the website',
      description: 'Pages, routing, responsive design.',
      status: 'pending',
    },
  },
];

/**
 * @param userMessage - The raw text from the user's message
 * @returns A workflow with steps matching detected keywords, or null if nothing matched
 * @example
 * const workflow = detectWorkflow('ship my SaaS with auth and payments');
 */
export const detectWorkflow = (userMessage: string): Workflow | null => {
  const lower = userMessage.toLowerCase();
  const matched: WorkflowStep[] = [];
  const seenIds = new Set<string>();

  // For "full", "ship", or "saas" — use the full saas preset order
  if (lower.includes('full') || lower.includes('ship') || lower.includes('saas')) {
    for (const template of STEP_TEMPLATES) {
      if (!seenIds.has(template.step.id)) {
        // Include scaffold, landing, terms, privacy, dashboard, billing, settings, auth, database, payment, deploy
        const saasIds = [
          'scaffold',
          'landing',
          'terms',
          'privacy',
          'dashboard',
          'billing',
          'settings',
          'auth',
          'database',
          'payment',
          'deploy',
        ];
        if (saasIds.includes(template.step.id)) {
          matched.push(withActionBrand(template.step, lower));
          seenIds.add(template.step.id);
        }
      }
    }

    if (matched.length > 0) {
      // Sort to the canonical order
      const orderMap = new Map(saasOrder.map((id, i) => [id, i]));
      const orderFor = (id: string): number => {
        const order = orderMap.get(id);
        if (order === undefined) {
          throw new Error(`Workflow step ${id} is missing from the SaaS order.`);
        }
        return order;
      };
      matched.sort((a, b) => orderFor(a.id) - orderFor(b.id));

      return {
        id: `workflow-${Date.now()}`,
        title: 'Ship your SaaS',
        tagline: `${matched.length} steps — full build.`,
        steps: matched,
      };
    }
  }

  for (const template of STEP_TEMPLATES) {
    if (!seenIds.has(template.step.id)) {
      const hit = template.keywords.some((kw) => lower.includes(kw));
      if (hit) {
        matched.push(withActionBrand(template.step, lower));
        seenIds.add(template.step.id);
      }
    }
  }

  if (matched.length === 0) return null;

  // Always end with deploy if user said "ship"
  if (lower.includes('ship') && !seenIds.has('deploy')) {
    const deployTemplate = STEP_TEMPLATES.find((t) => t.step.id === 'deploy');
    if (deployTemplate) matched.push(withActionBrand(deployTemplate.step, lower));
  }

  return {
    id: `workflow-${Date.now()}`,
    title: 'Building your project',
    tagline: `${matched.length} steps detected from your request.`,
    steps: matched,
  };
};

const saasOrder = [
  'scaffold',
  'landing',
  'terms',
  'privacy',
  'dashboard',
  'billing',
  'settings',
  'auth',
  'database',
  'payment',
  'deploy',
];
