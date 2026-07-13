export type WorkflowStepStatus = 'pending' | 'running' | 'done' | 'error';

export type WorkflowStep = {
  id: string;
  label: string;
  description: string;
  status: WorkflowStepStatus;
  subSteps?: WorkflowStep[];
  /**
   * Brand for the action (neon, stripe, lemon squeezy, cloudflare, …).
   * Drives the dynamic logo when the step runs / completes.
   */
  provider?: string;
  /** Journey-style domain used when provider is missing (domain default logo). */
  domain?: 'auth' | 'database' | 'payments' | 'deploy' | 'crud';
};

export type Workflow = {
  id: string;
  title: string;
  tagline: string;
  steps: WorkflowStep[];
};

export const saasWorkflow: Workflow = {
  id: 'ship-saas',
  title: 'Ship your SaaS',
  tagline: 'From zero to paid in one session.',
  steps: [
    {
      id: 'scaffold',
      label: 'Scaffold the project',
      description: 'Create repo, install dependencies, set up tooling.',
      status: 'pending',
    },
    {
      id: 'landing',
      label: 'Landing page',
      description: 'Hero section, features grid, email capture.',
      status: 'pending',
    },
    {
      id: 'terms',
      label: 'Terms of service',
      description: 'Generate legal terms page.',
      status: 'pending',
    },
    {
      id: 'privacy',
      label: 'Privacy policy',
      description: 'Generate privacy policy page.',
      status: 'pending',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Main app layout, navigation, overview.',
      status: 'pending',
    },
    {
      id: 'billing',
      label: 'Billing',
      description: 'Subscription management, invoices, usage.',
      status: 'pending',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Account settings, profile, preferences.',
      status: 'pending',
    },
    {
      id: 'auth',
      label: 'Add authentication',
      description: 'Sign up, sign in, Google OAuth, forgot password with OTP.',
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
    {
      id: 'database',
      label: 'Wire the database',
      description: 'Schema, migrations, seed data.',
      status: 'pending',
    },
    {
      id: 'payment',
      label: 'Enable payments',
      description: 'Stripe, PayPal, Lemon Squeezy — checkout, webhooks, portal.',
      status: 'pending',
    },
    {
      id: 'deploy',
      label: 'Go live',
      description: 'Deploy to Cloudflare / Vercel / Railway.',
      status: 'pending',
    },
  ],
};
