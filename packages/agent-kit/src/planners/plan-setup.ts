export type SetupDomain = 'payments' | 'auth' | 'database' | 'deploy' | 'email';

export interface SetupStep {
  readonly order: number;
  readonly builderMessage: string;
  readonly skill?: string;
  readonly envKeys?: readonly string[];
  readonly verify?: string;
  readonly agentNote?: string;
}

export interface SetupPlan {
  readonly domain: SetupDomain;
  readonly steps: readonly SetupStep[];
  readonly summary: string;
}

const SETUP_PLANS: Readonly<Record<SetupDomain, SetupPlan>> = {
  payments: {
    domain: 'payments',
    summary: 'Let your app take payments safely.',
    steps: [
      {
        order: 1,
        builderMessage: 'Checking what payment setup your app needs…',
        skill: 'setup-payments',
        envKeys: ['PAYMENT_PROVIDER', 'LEMON_SQUEEZY_API_KEY'],
        agentNote: 'Resolve payment provider via @vybekiit/payments',
      },
      {
        order: 2,
        builderMessage: 'Adding a practice checkout so you can test…',
        verify: 'practice-checkout',
      },
      {
        order: 3,
        builderMessage: 'Payments are working! 🎉',
        verify: 'webhook-or-fulfillment',
      },
    ],
  },
  auth: {
    domain: 'auth',
    summary: 'Let people create accounts and sign in.',
    steps: [
      {
        order: 1,
        builderMessage: 'Setting up sign-in…',
        skill: 'add-signin',
        envKeys: ['AUTH_PROVIDER', 'DATABASE_URL'],
        agentNote: 'Web uses add-signin; mobile/ext use connect-account + backend',
      },
      {
        order: 2,
        builderMessage: 'Checking sign-in works…',
        verify: 'sign-in-screen',
      },
    ],
  },
  database: {
    domain: 'database',
    summary: 'Give your app a place to remember things.',
    steps: [
      {
        order: 1,
        builderMessage: 'Planning what your app should remember…',
        skill: 'design-my-data',
        agentNote: 'Run vybekiit plan-data-model for structured output',
      },
      {
        order: 2,
        builderMessage: 'Saving that structure…',
        skill: 'save-data',
        envKeys: ['DATA_PROVIDER', 'DATABASE_URL'],
      },
      {
        order: 3,
        builderMessage: 'Your app can remember things now! 🎉',
        verify: 'read-write-smoke',
      },
    ],
  },
  deploy: {
    domain: 'deploy',
    summary: 'Put your app online for real visitors.',
    steps: [
      {
        order: 1,
        builderMessage: 'Checking your app is ready to go live…',
        skill: 'check-safety',
      },
      {
        order: 2,
        builderMessage: 'Putting your app online…',
        skill: 'go-live',
        envKeys: ['HOSTING', 'APP_URL'],
      },
      {
        order: 3,
        builderMessage: 'Your app is live! 🎉',
        verify: 'public-url-loads',
      },
    ],
  },
  email: {
    domain: 'email',
    summary: 'Send emails from your app automatically.',
    steps: [
      {
        order: 1,
        builderMessage: 'Setting up email…',
        skill: 'setup-email',
        envKeys: ['EMAIL_PROVIDER'],
      },
      {
        order: 2,
        builderMessage: 'Sending a test email…',
        verify: 'test-email-delivered',
      },
    ],
  },
};

/**
 * Ordered setup checklist for a domain — complements buyer skills with env + verify hints.
 */
export function planSetup(domain: SetupDomain): SetupPlan {
  return SETUP_PLANS[domain];
}
