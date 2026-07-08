/**
 * Official documentation URLs for stack providers — agent-only reference catalog.
 * Used by planDocFallback() and rendered into `.vybekiit/agent/tech-references.md`.
 */

export type TechReference = {
  readonly id: string;
  readonly label: string;
  readonly docsUrl: string;
  readonly apiRefUrl?: string;
  readonly mcpDocsUrl?: string;
  readonly mcpSnippet?: string;
  readonly envKeys?: readonly string[];
  readonly troubleshootingPath?: string;
};

export const TECH_REFERENCES: readonly TechReference[] = [
  {
    id: 'better-auth',
    label: 'better-auth',
    docsUrl: 'https://www.better-auth.com/docs',
    envKeys: ['AUTH_PROVIDER', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'DATABASE_URL'],
  },
  {
    id: 'twilio',
    label: 'Twilio SMS / Verify',
    docsUrl: 'https://www.twilio.com/docs',
    apiRefUrl: 'https://www.twilio.com/docs/messaging',
    mcpDocsUrl: 'https://mcp.twilio.com/docs',
    mcpSnippet: 'mcp-twilio-docs.json',
    envKeys: [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_FROM_NUMBER',
      'TWILIO_VERIFY_SERVICE_SID',
    ],
    troubleshootingPath: 'https://www.twilio.com/docs/messaging/guides/debugging-common-issues',
  },
  {
    id: 'twilio-whatsapp',
    label: 'Twilio WhatsApp',
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
    mcpDocsUrl: 'https://mcp.twilio.com/docs',
    mcpSnippet: 'mcp-twilio-docs.json',
    envKeys: ['TWILIO_WHATSAPP_FROM'],
  },
  {
    id: 'supabase',
    label: 'Supabase',
    docsUrl: 'https://supabase.com/docs',
    mcpSnippet: 'mcp-supabase.json',
    envKeys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'],
  },
  {
    id: 'stripe',
    label: 'Stripe',
    docsUrl: 'https://docs.stripe.com',
    mcpSnippet: 'mcp-stripe.json',
    envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  },
  {
    id: 'neon',
    label: 'Neon',
    docsUrl: 'https://neon.tech/docs',
    mcpSnippet: 'mcp-neon.json',
    envKeys: ['DATABASE_URL'],
  },
  {
    id: 'firebase',
    label: 'Firebase',
    docsUrl: 'https://firebase.google.com/docs',
    mcpSnippet: 'mcp-firebase.json',
  },
  {
    id: 'mongodb',
    label: 'MongoDB Atlas',
    docsUrl: 'https://www.mongodb.com/docs/',
    apiRefUrl: 'https://www.mongodb.com/docs/drivers/node/current/',
    mcpDocsUrl: 'https://www.mongodb.com/docs/mcp-server/overview/',
    mcpSnippet: 'mcp-mongodb.json',
    envKeys: ['DATA_PROVIDER', 'MONGODB_URI', 'MONGODB_DB'],
    troubleshootingPath: 'https://www.mongodb.com/docs/mcp-server/configuration/troubleshoot/',
  },
  {
    id: 'express',
    label: 'Express',
    docsUrl: 'https://expressjs.com',
  },
  {
    id: 'expo',
    label: 'Expo',
    docsUrl: 'https://docs.expo.dev',
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    docsUrl: 'https://nextjs.org/docs',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    docsUrl: 'https://developers.cloudflare.com',
    troubleshootingPath:
      'https://developers.cloudflare.com/fundamentals/reference/troubleshooting/',
  },
  {
    id: 'railway',
    label: 'Railway',
    docsUrl: 'https://docs.railway.com',
    mcpDocsUrl: 'https://docs.railway.com/ai/mcp-server',
    mcpSnippet: 'mcp-railway-local.json',
    envKeys: [
      'HOSTING_PROVIDER',
      'DATA_PROVIDER',
      'DATABASE_URL',
      'RAILWAY_PROJECT_ID',
      'RAILWAY_SERVICE_ID',
    ],
  },
  {
    id: 'resend',
    label: 'Resend email',
    docsUrl: 'https://resend.com/docs',
    envKeys: ['EMAIL_PROVIDER', 'RESEND_API_KEY'],
  },
  {
    id: 'lemon-squeezy',
    label: 'Lemon Squeezy',
    docsUrl: 'https://docs.lemonsqueezy.com',
    envKeys: ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID'],
  },
  {
    id: 'sentry',
    label: 'Sentry error alerts',
    docsUrl: 'https://docs.sentry.io',
    mcpDocsUrl: 'https://mcp.sentry.dev/mcp',
    mcpSnippet: 'mcp-sentry.json',
    envKeys: ['OBSERVABILITY_PROVIDER', 'SENTRY_DSN'],
  },
  {
    id: 'posthog',
    label: 'PostHog analytics',
    docsUrl: 'https://posthog.com/docs',
    mcpDocsUrl: 'https://mcp.posthog.com/mcp',
    mcpSnippet: 'mcp-posthog.json',
    envKeys: ['ANALYTICS_PROVIDER', 'POSTHOG_API_KEY', 'POSTHOG_HOST'],
  },
  {
    id: 'plausible',
    label: 'Plausible analytics',
    docsUrl: 'https://plausible.io/docs',
    envKeys: ['PLAUSIBLE_DOMAIN', 'ANALYTICS_PROVIDER'],
  },
];

export const TECH_REFERENCE_MAP: Readonly<Record<string, TechReference>> = Object.fromEntries(
  TECH_REFERENCES.map((ref) => [ref.id, ref]),
);

/**
 * Run render tech references table.
 *
 * @returns The rendered render tech references table text.
 * @example
 * const result = renderTechReferencesTable();
 */
export const renderTechReferencesTable = (): string => {
  const lines = [
    '# Official tech references (agent-only)',
    '',
    'When MCP or first-pass debug fails, run `vybekiit doc-fallback <id>` and follow these URLs.',
    '',
    '| id | Docs | MCP | Env keys |',
    '|---|---|---|---|',
  ];
  for (const ref of TECH_REFERENCES) {
    const mcp = ref.mcpDocsUrl === undefined ? '—' : ref.mcpDocsUrl;
    const keys = ref.envKeys === undefined ? '—' : ref.envKeys.join(', ');
    lines.push(`| ${ref.id} | ${ref.docsUrl} | ${mcp} | ${keys} |`);
  }
  return lines.join('\n');
};
