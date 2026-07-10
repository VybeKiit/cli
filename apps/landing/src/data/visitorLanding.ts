/**
 * Visitor-ready marketing homepage copy and structure.
 * Matches the approved light mock (vybekiit-landing-age-last-version).
 * Components only render this data.
 */

import { PRICE, PRICE_VALUE_STACK } from '@/data/site';

/** Hero section copy for the light marketing homepage. */
export const VISITOR_HERO = {
  eyebrow: 'You direct. The agent builds.',
  /**
   * Plain-text headline for analytics / a11y. The hero renders a marker highlight
   * on “your first payment” so vibe coders see the money outcome first.
   */
  headline: 'Go live, and take your first payment, in session one.',
  /** Phrase painted with the marker animation inside the h1. */
  headlineHighlight: 'your first payment',
  subhead:
    'Describe it in plain language. The agent wires payments, auth, database, and deploy across web, mobile, and a browser extension. One purchase, $29.',
  primaryCtaLabel: `Get VybeKiit · ${PRICE.display}`,
  trustChips: [
    'Lemon Squeezy · Merchant of Record',
    `${PRICE.refundDays}-day refund`,
    'Web · Mobile · Extension',
  ] as const,
} as const;

/** Right-rail AI operator checklist shown in the hero. */
export const AI_OPERATOR_CARD = {
  title: 'AI operator',
  steps: [
    { id: 'plan', label: 'Plan', done: true, highlight: false },
    { id: 'build', label: 'Build', done: true, highlight: false },
    { id: 'wire', label: 'Wire payments', done: true, highlight: false },
    { id: 'verify', label: 'Verify', done: true, highlight: false },
    { id: 'live', label: 'Live', done: true, highlight: true },
  ] as const,
  liveUrlLabel: 'yourapp.com is live',
} as const;

/** One trusted stack / agent mark under the hero. */
export interface TechTrustMark {
  readonly id: string;
  readonly label: string;
  readonly slug: string;
}

/**
 * AI coding agents VybeKiit supports — top marquee (reverse direction).
 * Slugs map to `LogoMarkIcon` / R2 `brand-marks/*` WebPs (see `cdnAssetUrl`).
 */
export const AI_CODING_AGENTS_STRIP = {
  heading: 'Works with the AI coding agents you already use',
  marks: [
    { id: 'claude', label: 'Claude Code', slug: 'claude' },
    { id: 'cursor', label: 'Cursor', slug: 'cursor' },
    { id: 'codex', label: 'Codex', slug: 'codex' },
    { id: 'kiro', label: 'Kiro', slug: 'kiro' },
    { id: 'kimi', label: 'Kimi', slug: 'kimi' },
    { id: 'zed', label: 'Zed', slug: 'zed' },
    { id: 'opencode', label: 'OpenCode', slug: 'opencode' },
    { id: 'grok', label: 'Grok', slug: 'grok' },
    { id: 'gemini', label: 'Gemini', slug: 'googlegemini' },
    { id: 'devin', label: 'Devin', slug: 'devin' },
  ] as const satisfies readonly TechTrustMark[],
} as const;

/**
 * Full product stack shipped with the kit — bottom marquee (forward direction).
 * Mirrors `PRODUCT_STACK_MARKS` in landing.ts for a single visitor-facing list.
 */
export const TECH_TRUST_STRIP = {
  heading: 'Built with the tools you already trust',
  marks: [
    { id: 'next', label: 'Next.js', slug: 'nextdotjs' },
    { id: 'tailwind', label: 'Tailwind CSS', slug: 'tailwindcss' },
    { id: 'typescript', label: 'TypeScript', slug: 'typescript' },
    { id: 'react', label: 'React', slug: 'react' },
    { id: 'shadcn', label: 'shadcn/ui', slug: 'shadcn' },
    { id: 'supabase', label: 'Supabase', slug: 'supabase' },
    { id: 'cloudflare', label: 'Cloudflare', slug: 'cloudflare' },
    { id: 'lemon', label: 'Lemon Squeezy', slug: 'lemonsqueezy' },
    { id: 'better-auth', label: 'better-auth', slug: 'betterauth' },
    { id: 'openai', label: 'OpenAI', slug: 'openai' },
    { id: 'expo', label: 'Expo', slug: 'expo' },
    { id: 'wxt', label: 'WXT', slug: 'wxt' },
    { id: 'sonner', label: 'Sonner', slug: 'sonner' },
    { id: 'resend', label: 'Resend', slug: 'resend' },
    { id: 'stripe', label: 'Stripe', slug: 'stripe' },
    { id: 'paypal', label: 'PayPal', slug: 'paypal' },
    { id: 'vercel', label: 'Vercel', slug: 'vercel' },
    { id: 'aws', label: 'AWS', slug: 'amazonaws' },
    { id: 'mongodb', label: 'MongoDB', slug: 'mongodb' },
    { id: 'google', label: 'Google', slug: 'google' },
    { id: 'sentry', label: 'Sentry', slug: 'sentry' },
    { id: 'plausible', label: 'Plausible', slug: 'plausible' },
    { id: 'chrome', label: 'Chrome', slug: 'googlechrome' },
    { id: 'appstore', label: 'App Store', slug: 'appstore' },
    { id: 'play', label: 'Google Play', slug: 'googleplay' },
    { id: 'github', label: 'GitHub', slug: 'github' },
    { id: 'node', label: 'Node.js', slug: 'nodedotjs' },
    { id: 'playwright', label: 'Playwright', slug: 'playwright' },
    { id: 'figma', label: 'Figma', slug: 'figma' },
  ] as const satisfies readonly TechTrustMark[],
} as const;

/** Icon key for an operator step card. */
export type OperatorStepIcon = 'plan' | 'build' | 'wire' | 'verify' | 'live';

/** One Plan→Live operator step card. */
export interface OperatorStep {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly icon: OperatorStepIcon;
  /** When true, the card uses the primary blue treatment (Live). */
  readonly featured: boolean;
}

export const OPERATOR_STEPS_SECTION = {
  heading: 'One agent operates the whole stack.',
  steps: [
    {
      id: 'plan',
      title: 'Plan',
      body: 'Turn your idea into a clear plan and data model.',
      icon: 'plan',
      featured: false,
    },
    {
      id: 'build',
      title: 'Build',
      body: 'Generate the full app across web, mobile, and extension.',
      icon: 'build',
      featured: false,
    },
    {
      id: 'wire',
      title: 'Wire',
      body: 'Connect payments, auth, database, and env config.',
      icon: 'wire',
      featured: false,
    },
    {
      id: 'verify',
      title: 'Verify',
      body: 'Run checks, tests, and security verifications.',
      icon: 'verify',
      featured: false,
    },
    {
      id: 'live',
      title: 'Live',
      body: 'Deploy everything. You go live in session one.',
      icon: 'live',
      featured: true,
    },
  ] as const satisfies readonly OperatorStep[],
} as const;

/** Problem / overview block copy. */
export const PROBLEM_OVERVIEW = {
  problemLabel: 'THE PROBLEM',
  problemHeading: 'Boilerplates still leave you holding the bag.',
  problemBody: 'VybeKiit operates the stack, end to end.',
  overviewTitle: 'Overview',
  rows: [
    { id: 'payments', label: 'Payments', value: 'Manual', tone: 'muted' as const },
    { id: 'auth', label: 'Auth', value: 'Manual', tone: 'muted' as const },
    { id: 'database', label: 'Database', value: 'Manual', tone: 'muted' as const },
    { id: 'deploy', label: 'Deploy', value: 'Manual', tone: 'muted' as const },
    { id: 'you', label: 'You', value: 'Overwhelmed', tone: 'danger' as const },
  ] as const,
} as const;

/** Solution / payments block copy. */
export const SOLUTION_PAYMENTS = {
  solutionLabel: 'THE SOLUTION',
  solutionHeading: 'Take payments in your first session.',
  solutionBody:
    'The agent connects payments, handles webhooks, and gives you a working checkout instantly.',
  toastLabel: 'Payment received',
  revenueLabel: 'Revenue',
  revenueValue: '$2,841',
  revenueDelta: '+27.4% vs last 7 days',
} as const;

/** Three-platform bundle section. */
export const PLATFORMS_BUNDLE = {
  heading: 'One purchase. Web, mobile, and a browser extension.',
  subhead: 'One agent. Zero plumbing.',
  platforms: [
    { id: 'web', label: 'Web' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'extension', label: 'Extension' },
  ] as const,
} as const;

/** Coverage glyph for the visitor compare table. */
export type VisitorCoverage = 'yes' | 'partial' | 'no';

/** One row in the simplified visitor comparison matrix. */
export interface VisitorCompareRow {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly agentOperates: VisitorCoverage;
  readonly plainLanguage: VisitorCoverage;
  readonly updatesInstall: VisitorCoverage;
  readonly threePlatforms: VisitorCoverage;
  readonly taxesHandled: VisitorCoverage;
  readonly featured: boolean;
}

/**
 * Compare table aimed at vibe coders: ship like an engineer without becoming one.
 * Scores are honest; rivals win on some axes (see footnote).
 */
export const VISITOR_COMPARE = {
  heading: 'Become a software engineer without becoming one.',
  subhead:
    'Other kits hand you code and wish you luck. VybeKiit is the agent that builds, wires, and ships for you.',
  footnote:
    'Need deep multi-tenant B2B on day one (RBAC, admin, jobs)? MakerKit and Supastarter are stronger there. VybeKiit wins when you want the agent to operate the whole product so you never read the code.',
  axes: [
    { key: 'price' as const, label: 'Price' },
    { key: 'agentOperates' as const, label: 'Agent builds it for you' },
    { key: 'plainLanguage' as const, label: 'Plain language only' },
    { key: 'updatesInstall' as const, label: 'Updates install (no merge)' },
    { key: 'threePlatforms' as const, label: 'Web + mobile + extension' },
    { key: 'taxesHandled' as const, label: 'Taxes handled (MoR)' },
  ],
  rows: [
    {
      id: 'vybekiit',
      name: 'VybeKiit',
      price: PRICE.display,
      agentOperates: 'yes',
      plainLanguage: 'yes',
      updatesInstall: 'yes',
      threePlatforms: 'yes',
      taxesHandled: 'yes',
      featured: true,
    },
    {
      id: 'shipfast',
      name: 'ShipFast',
      price: '$199+',
      agentOperates: 'no',
      plainLanguage: 'no',
      updatesInstall: 'no',
      threePlatforms: 'partial',
      taxesHandled: 'partial',
      featured: false,
    },
    {
      id: 'lovable',
      name: 'Lovable',
      price: '$20/mo',
      agentOperates: 'partial',
      plainLanguage: 'yes',
      updatesInstall: 'no',
      threePlatforms: 'partial',
      taxesHandled: 'no',
      featured: false,
    },
    {
      id: 'makerkit',
      name: 'MakerKit',
      price: '$299+',
      agentOperates: 'no',
      plainLanguage: 'no',
      updatesInstall: 'no',
      threePlatforms: 'no',
      taxesHandled: 'partial',
      featured: false,
    },
    {
      id: 'supastarter',
      name: 'Supastarter',
      price: '$349+',
      agentOperates: 'no',
      plainLanguage: 'no',
      updatesInstall: 'no',
      threePlatforms: 'no',
      taxesHandled: 'partial',
      featured: false,
    },
    {
      id: 'open-saas',
      name: 'Open SaaS',
      price: '$0',
      agentOperates: 'no',
      plainLanguage: 'no',
      updatesInstall: 'no',
      threePlatforms: 'no',
      taxesHandled: 'partial',
      featured: false,
    },
  ] as const satisfies readonly VisitorCompareRow[],
} as const;

/** Pricing section for the visitor homepage. */
export const VISITOR_PRICING = {
  id: 'pricing',
  display: PRICE.display,
  compareAt: PRICE_VALUE_STACK.compareAtDisplay,
  cadence: 'Pay once · yours for life',
  /** Shown under the struck compare-at after the price rolls in (one line, not split). */
  savingsLine: `Save ${PRICE_VALUE_STACK.savingsPercent}% vs buying web + mobile + extension kits alone · Every purchase raises the price`,
  /** Substring of savingsLine to paint bold red (the discount itself). */
  savingsDiscount: `${PRICE_VALUE_STACK.savingsPercent}%`,
  bullets: [
    'AI Operator + Web + Mobile + Extension',
    'All features. No limits.',
    'Lifetime access. Yours forever.',
    '14-day money-back guarantee.',
  ] as const,
  ctaLabel: `Get VybeKiit · ${PRICE.display}`,
} as const;

/** FAQ section heading for the visitor homepage. */
export const VISITOR_FAQ = {
  heading: 'Which package should you get?',
} as const;
