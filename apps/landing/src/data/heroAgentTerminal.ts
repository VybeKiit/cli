/**
 * Hero terminal data: vibe-coder prompts that rotate across supported AI agents.
 * Plain-language productivity app ideas (no release-engineering jargon).
 */

export type HeroAgentId =
  | 'claude'
  | 'cursor'
  | 'codex'
  | 'kiro'
  | 'kimi'
  | 'zed'
  | 'opencode'
  | 'grok'
  | 'gemini'
  | 'devin';

export interface HeroAgent {
  readonly id: HeroAgentId;
  readonly label: string;
  /** LogoMarkIcon slug (or builder mark for cursor/claude/codex). */
  readonly slug: string;
  /** When true, render BuilderAssistantMark instead of LogoMarkIcon. */
  readonly builderMark: boolean;
}

export const HERO_AGENTS: readonly HeroAgent[] = [
  { id: 'claude', label: 'Claude Code', slug: 'claude', builderMark: true },
  { id: 'cursor', label: 'Cursor', slug: 'cursor', builderMark: true },
  { id: 'codex', label: 'Codex', slug: 'codex', builderMark: true },
  { id: 'kiro', label: 'Kiro', slug: 'kiro', builderMark: false },
  { id: 'kimi', label: 'Kimi', slug: 'kimi', builderMark: false },
  { id: 'zed', label: 'Zed', slug: 'zed', builderMark: false },
  { id: 'opencode', label: 'OpenCode', slug: 'opencode', builderMark: false },
  { id: 'grok', label: 'Grok', slug: 'grok', builderMark: false },
  { id: 'gemini', label: 'Gemini', slug: 'googlegemini', builderMark: false },
  { id: 'devin', label: 'Devin', slug: 'devin', builderMark: false },
] as const;

export type HeroPromptSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'icon'; readonly slug: string };

export interface HeroPromptEntry {
  readonly agentId: HeroAgentId;
  readonly segments: readonly HeroPromptSegment[];
  readonly typeable: string;
  readonly plain: string;
}

const BRAND_LABELS: Record<string, string> = {
  google: 'Google',
  lemonsqueezy: 'Lemon Squeezy',
  stripe: 'Stripe',
  supabase: 'Supabase',
  cloudflare: 'Cloudflare',
  appstore: 'the App Store',
  googleplay: 'Google Play',
  googlechrome: 'Chrome',
  paypal: 'PayPal',
  resend: 'Resend',
  expo: 'Expo',
  mongodb: 'MongoDB',
  vercel: 'Vercel',
};

const labelForIcon = (slug: string): string => {
  const label = BRAND_LABELS[slug];
  return label === undefined ? slug : label;
};

const buildPrompt = (
  agentId: HeroAgentId,
  segments: readonly HeroPromptSegment[],
): HeroPromptEntry => {
  const typeable = segments
    .filter((segment) => segment.kind === 'text')
    .map((segment) => segment.text)
    .join('');
  const plain = segments
    .map((segment) => (segment.kind === 'icon' ? labelForIcon(segment.slug) : segment.text))
    .join('');
  return { agentId, segments, typeable, plain };
};

/**
 * Real-sounding vibe-coder prompts for productivity apps of every kind.
 * Agent ids rotate so the hero feels like “works with every agent you already use.”
 */
export const HERO_VIBE_PROMPTS: readonly HeroPromptEntry[] = [
  buildPrompt('claude', [
    {
      kind: 'text',
      text: 'build me a habit tracker app where friends can see each others streaks and cheer them on',
    },
  ]),
  buildPrompt('cursor', [
    {
      kind: 'text',
      text: 'build me a freelance invoice app so clients pay me online with ',
    },
    { kind: 'icon', slug: 'lemonsqueezy' },
  ]),
  buildPrompt('codex', [
    {
      kind: 'text',
      text: 'build me a team standup board that rolls over every morning and pings people who forgot',
    },
  ]),
  buildPrompt('kiro', [
    {
      kind: 'text',
      text: 'build me a recipe box app with meal plans and a grocery list I can share with my partner',
    },
  ]),
  buildPrompt('gemini', [
    {
      kind: 'text',
      text: 'build me a client portal where people book calls and pay a deposit with ',
    },
    { kind: 'icon', slug: 'stripe' },
  ]),
  buildPrompt('devin', [
    {
      kind: 'text',
      text: 'build me a simple CRM for my tutoring business with notes, next lessons, and payments',
    },
  ]),
  buildPrompt('grok', [
    {
      kind: 'text',
      text: 'build me a focus timer with daily goals and a nice dashboard of how much deep work I did',
    },
  ]),
  buildPrompt('cursor', [
    {
      kind: 'text',
      text: 'build me a waitlist landing page that emails people when we launch using ',
    },
    { kind: 'icon', slug: 'resend' },
  ]),
  buildPrompt('claude', [
    {
      kind: 'text',
      text: 'build me a phone app for my membership so people can check in at the door',
    },
    { kind: 'text', text: ' and get it on ' },
    { kind: 'icon', slug: 'appstore' },
    { kind: 'text', text: ' and ' },
    { kind: 'icon', slug: 'googleplay' },
  ]),
  buildPrompt('opencode', [
    {
      kind: 'text',
      text: 'build me a chrome popup that saves reading list links and syncs them to my account',
    },
  ]),
  buildPrompt('kimi', [
    {
      kind: 'text',
      text: 'build me a study planner with flashcards, spaced review, and progress charts',
    },
  ]),
  buildPrompt('zed', [
    {
      kind: 'text',
      text: 'build me a budget app that connects accounts and shows where my money went this month',
    },
  ]),
  buildPrompt('codex', [
    {
      kind: 'text',
      text: 'build me a job application tracker with stages, notes, and reminder emails',
    },
  ]),
  buildPrompt('kiro', [
    {
      kind: 'text',
      text: 'build me a booking site for my barber shop with calendar slots and ',
    },
    { kind: 'icon', slug: 'paypal' },
    { kind: 'text', text: ' checkout' },
  ]),
  buildPrompt('claude', [
    {
      kind: 'text',
      text: 'build me a content calendar for my newsletter with drafts and publish dates',
    },
  ]),
  buildPrompt('cursor', [
    {
      kind: 'text',
      text: 'build me a private notes app that signs people in with ',
    },
    { kind: 'icon', slug: 'google' },
    { kind: 'text', text: ' and saves everything in ' },
    { kind: 'icon', slug: 'supabase' },
  ]),
  buildPrompt('gemini', [
    {
      kind: 'text',
      text: 'build me a family chore board with points, rewards, and a mobile app kids can use',
    },
  ]),
  buildPrompt('devin', [
    {
      kind: 'text',
      text: 'build me a SaaS for coaches: client list, session notes, and automatic invoices',
    },
  ]),
  buildPrompt('grok', [
    {
      kind: 'text',
      text: 'build me a language exchange app where people practice speaking and book sessions',
    },
  ]),
  buildPrompt('opencode', [
    {
      kind: 'text',
      text: 'build me a marketplace for digital templates with seller payouts and reviews',
    },
  ]),
] as const;

/** Random vibe-coder toasts that appear between the trust marquees. */
export const TRUST_STRIP_VIBE_TOASTS = [
  'Nobody knows what Expo is. With us you ship iPhone and Android apps to the stores.',
  'You say “make people pay me.” We wire checkout, taxes, and the thank-you email.',
  '“Put it on the internet” becomes a real URL people can open today.',
  'Chrome extension? You describe the popup. We ship the browser add-on.',
  'You never set up a database. Your app just remembers customers.',
  '“Sign in with Google” is one sentence. We handle the boring buttons.',
  'App Store and Google Play without learning mobile tooling.',
  'You vibe the product. The agent operates web, mobile, and extension.',
  'No merge conflicts. Updates install. You keep building.',
  'Describe the dashboard. Watch revenue numbers show up live.',
] as const;
