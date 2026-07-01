/**
 * Canonical goal → skill routing per template.
 * Source of truth for {@link planGoalRouting} and {@link checkGoalDrift}.
 */

export type TemplateId = 'web' | 'mobile' | 'extension' | 'backend' | 'spa';

export interface GoalCatalogEntry {
  readonly id: string;
  readonly phrases: readonly string[];
  readonly skills: Readonly<Record<TemplateId, string | null>>;
}

export const GOAL_ENTRIES: readonly GoalCatalogEntry[] = [
  {
    id: 'onboarding',
    phrases: ['set up my app', "let's start", 'get me going', 'just bought'],
    skills: {
      web: 'onboarding',
      mobile: 'onboarding',
      extension: 'onboarding',
      spa: 'onboarding',
      backend: 'onboarding',
    },
  },
  {
    id: 'plan-my-idea',
    phrases: [
      'help me plan',
      'figure out my idea',
      'think it through',
      'marketplace',
      'like airbnb',
    ],
    skills: {
      web: 'plan-my-idea',
      mobile: 'plan-my-idea',
      extension: 'plan-my-idea',
      spa: 'plan-my-idea',
      backend: 'plan-my-idea',
    },
  },
  {
    id: 'setup-payments',
    phrases: ['add payments', 'take money', 'sell something', 'charge people'],
    skills: {
      web: 'setup-payments',
      mobile: 'setup-payments',
      extension: 'setup-payments',
      spa: 'setup-payments',
      backend: 'wire-payments',
    },
  },
  {
    id: 'go-live',
    phrases: ['put it online', 'publish', 'make it live', 'ship it', 'deploy'],
    skills: {
      web: 'go-live',
      mobile: 'publish-app',
      extension: 'publish-extension',
      spa: 'go-live',
      backend: 'go-live',
    },
  },
  {
    id: 'sign-in',
    phrases: ['sign in', 'log in', 'create accounts', 'add users'],
    skills: {
      web: 'add-signin',
      mobile: 'connect-account',
      extension: 'connect-account',
      spa: 'connect-account',
      backend: 'wire-auth',
    },
  },
  {
    id: 'reset-password',
    phrases: ['forgot password', 'reset password', 'lost password', 'change password email'],
    skills: {
      web: 'reset-password',
      mobile: 'connect-account',
      extension: 'connect-account',
      spa: 'connect-account',
      backend: 'reset-password',
    },
  },
  {
    id: 'sign-in-with-email-link',
    phrases: ['magic link', 'email link sign in', 'sign in without password', 'passwordless email'],
    skills: {
      web: 'sign-in-with-email-link',
      mobile: 'connect-account',
      extension: 'connect-account',
      spa: 'connect-account',
      backend: 'sign-in-with-email-link',
    },
  },
  {
    id: 'sign-in-with-phone',
    phrases: ['sign in with phone', 'text me a code', 'sms login', 'phone number login'],
    skills: {
      web: 'sign-in-with-phone',
      mobile: 'connect-account',
      extension: 'connect-account',
      spa: 'connect-account',
      backend: 'sign-in-with-phone',
    },
  },
  {
    id: 'setup-sms',
    phrases: ['set up sms', 'text messages', 'twilio', 'whatsapp messages', 'send texts'],
    skills: {
      web: 'setup-sms',
      mobile: 'connect-account',
      extension: 'connect-account',
      spa: 'connect-account',
      backend: 'setup-sms',
    },
  },
  {
    id: 'save-data',
    phrases: ['save my data', 'remember this', 'store info', 'add a database'],
    skills: {
      web: 'save-data',
      mobile: 'save-data',
      extension: 'save-data',
      spa: 'save-data',
      backend: 'wire-database',
    },
  },
  {
    id: 'design-my-data',
    phrases: ['design my database', 'what data do i need', 'what should my app remember'],
    skills: {
      web: 'design-my-data',
      mobile: 'design-my-data',
      extension: 'design-my-data',
      spa: 'design-my-data',
      backend: 'design-my-data',
    },
  },
  {
    id: 'add-files',
    phrases: ['upload', 'store files', 'attachments'],
    skills: {
      web: 'add-files',
      mobile: 'add-files',
      extension: null,
      spa: 'add-files',
      backend: 'add-upload',
    },
  },
  {
    id: 'setup-email',
    phrases: ['send emails', 'email my users', 'set up email'],
    skills: { web: 'setup-email', mobile: null, extension: null, spa: null, backend: 'wire-email' },
  },
  {
    id: 'doctor',
    phrases: ["it's broken", 'nothing works', 'get an error', 'check my app'],
    skills: {
      web: 'doctor',
      mobile: 'doctor',
      extension: 'doctor',
      spa: 'doctor',
      backend: 'doctor',
    },
  },
  {
    id: 'update-kit',
    phrases: ['update the kit', 'get the latest', 'upgrade'],
    skills: {
      web: 'update-kit',
      mobile: 'update-kit',
      extension: 'update-kit',
      spa: 'update-kit',
      backend: 'update-kit',
    },
  },
  {
    id: 'harden',
    phrases: ['lock down', 'make it safe', 'protect from abuse'],
    skills: {
      web: 'harden',
      mobile: 'check-safety',
      extension: 'check-safety',
      spa: 'check-safety',
      backend: 'harden',
    },
  },
  {
    id: 'add-route',
    phrases: ['add an endpoint', 'add api', 'new route'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'add-route' },
  },
  {
    id: 'add-crud',
    phrases: ['crud', 'create read update delete'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'add-crud' },
  },
  {
    id: 'add-images',
    phrases: ['add my logo', 'hero image', 'app icon', 'add images'],
    skills: {
      web: 'add-images',
      mobile: 'add-images',
      extension: 'add-images',
      spa: 'add-images',
      backend: null,
    },
  },
  {
    id: 'add-teams',
    phrases: ['invite teammates', 'add my team', 'organizations'],
    skills: {
      web: 'add-teams',
      mobile: 'add-teams',
      extension: 'add-teams',
      spa: 'add-teams',
      backend: null,
    },
  },
  {
    id: 'add-notifications',
    phrases: ['notify users', 'send alerts'],
    skills: {
      web: 'add-notifications',
      mobile: 'add-notifications',
      extension: 'add-notifications',
      spa: 'add-notifications',
      backend: null,
    },
  },
  {
    id: 'add-analytics',
    phrases: ['visitor stats', 'analytics', 'track usage'],
    skills: {
      web: 'add-analytics',
      mobile: 'add-analytics',
      extension: 'add-analytics',
      spa: 'add-analytics',
      backend: null,
    },
  },
  {
    id: 'add-ai',
    phrases: ['add ai', 'chatbot', 'smart replies'],
    skills: { web: 'add-ai', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'add-search',
    phrases: ['let users search', 'find things', 'search my data'],
    skills: { web: 'add-search', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'add-realtime',
    phrases: ['live updates', 'real-time', 'push changes instantly', 'refresh without reload'],
    skills: { web: 'add-realtime', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'add-blog',
    phrases: ['add a blog', 'write articles', 'changelog'],
    skills: { web: 'add-blog', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'buy-domain',
    phrases: ['get a domain', 'buy a web address', 'my own url'],
    skills: { web: 'buy-domain', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'sign-in-with-google',
    phrases: ['sign in with google', 'continue with google'],
    skills: {
      web: 'sign-in-with-google',
      mobile: 'sign-in-with-google',
      extension: 'sign-in-with-google',
      spa: 'sign-in-with-google',
      backend: null,
    },
  },
  {
    id: 'check-safety',
    phrases: ['am i ready to ship', 'is my app safe', 'did we cover security'],
    skills: {
      web: 'check-safety',
      mobile: 'check-safety',
      extension: 'check-safety',
      spa: 'check-safety',
      backend: null,
    },
  },
  {
    id: 'track-errors',
    phrases: ['tell me when things break', 'error alerts', 'app crashes'],
    skills: {
      web: 'track-errors',
      mobile: 'track-errors',
      extension: null,
      spa: 'track-errors',
      backend: null,
    },
  },
  {
    id: 'back-up-my-code',
    phrases: ['save my code', 'back up', 'put it on github'],
    skills: {
      web: 'back-up-my-code',
      mobile: 'back-up-my-code',
      extension: null,
      spa: 'back-up-my-code',
      backend: null,
    },
  },
  {
    id: 'add-language',
    phrases: ['translate my app', 'add spanish', 'make it hebrew'],
    skills: {
      web: 'add-language',
      mobile: 'add-language',
      extension: 'add-language',
      spa: 'add-language',
      backend: null,
    },
  },
  {
    id: 'configure-capabilities',
    phrases: ['camera', 'location permission', 'notifications permission'],
    skills: {
      web: null,
      mobile: 'configure-capabilities',
      extension: 'configure-capabilities',
      spa: null,
      backend: null,
    },
  },
  {
    id: 'publish-app',
    phrases: ['publish app', 'app store'],
    skills: { web: null, mobile: 'publish-app', extension: null, spa: null, backend: null },
  },
  {
    id: 'publish-extension',
    phrases: ['chrome store', 'publish extension'],
    skills: { web: null, mobile: null, extension: 'publish-extension', spa: null, backend: null },
  },
  {
    id: 'add-upload',
    phrases: ['file upload endpoint'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'add-upload' },
  },
  {
    id: 'wire-auth',
    phrases: ['wire auth'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'wire-auth' },
  },
  {
    id: 'wire-database',
    phrases: ['wire database'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'wire-database' },
  },
  {
    id: 'wire-payments',
    phrases: ['wire payments'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'wire-payments' },
  },
  {
    id: 'wire-email',
    phrases: ['wire email'],
    skills: { web: null, mobile: null, extension: null, spa: null, backend: 'wire-email' },
  },
  {
    id: 'connect-account-backend',
    phrases: ['connect account backend'],
    skills: {
      web: null,
      mobile: 'connect-account-backend',
      extension: 'connect-account-backend',
      spa: 'connect-account-backend',
      backend: null,
    },
  },
];

export const GOAL_CATALOG: Readonly<Record<string, GoalCatalogEntry>> = Object.fromEntries(
  GOAL_ENTRIES.map((entry) => [entry.id, entry]),
);
