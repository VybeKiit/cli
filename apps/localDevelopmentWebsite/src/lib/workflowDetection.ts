import type { Workflow, WorkflowStep } from './workflows';

type StepTemplate = {
  keywords: string[];
  step: WorkflowStep;
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
    keywords: ['database', 'db', 'schema', 'migration', 'postgres', 'mysql', 'supabase'],
    step: {
      id: 'database',
      label: 'Wire the database',
      description: 'Schema, migrations, seed data.',
      status: 'pending',
    },
  },
  {
    keywords: ['payment', 'stripe', 'checkout', 'paypal', 'lemon squeezy'],
    step: {
      id: 'payment',
      label: 'Enable payments',
      description: 'Stripe, PayPal, Lemon Squeezy — checkout, webhooks, portal.',
      status: 'pending',
    },
  },
  {
    keywords: ['deploy', 'live', 'ship', 'production', 'cloudflare', 'vercel'],
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
 */
export const detectWorkflow = (userMessage: string): Workflow | null => {
  const lower = userMessage.toLowerCase();
  const matched: WorkflowStep[] = [];
  const seenIds = new Set<string>();

  // For "full", "ship", or "saas" — use the full saas preset order
  if (lower.includes('full') || lower.includes('ship') || lower.includes('saas')) {
    for (const template of STEP_TEMPLATES) {
      if (seenIds.has(template.step.id)) continue;
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
        matched.push(template.step);
        seenIds.add(template.step.id);
      }
    }

    if (matched.length > 0) {
      // Sort to the canonical order
      const orderMap = new Map(saasOrder.map((id, i) => [id, i]));
      matched.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

      return {
        id: `workflow-${Date.now()}`,
        title: 'Ship your SaaS',
        tagline: `${matched.length} steps — full build.`,
        steps: matched,
      };
    }
  }

  for (const template of STEP_TEMPLATES) {
    if (seenIds.has(template.step.id)) continue;
    const hit = template.keywords.some((kw) => lower.includes(kw));
    if (hit) {
      matched.push(template.step);
      seenIds.add(template.step.id);
    }
  }

  if (matched.length === 0) return null;

  // Always end with deploy if user said "ship"
  if (lower.includes('ship') && !seenIds.has('deploy')) {
    const deployTemplate = STEP_TEMPLATES.find((t) => t.step.id === 'deploy');
    if (deployTemplate) matched.push(deployTemplate.step);
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
