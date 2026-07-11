/**
 * Visitor-ready marketing homepage copy and structure.
 * Matches the approved light mock (vybekiit-landing-age-last-version).
 * Components only render this data.
 */

import { PRICE, PRICE_VALUE_STACK } from '@/data/site';

/** Hero section copy for the light marketing homepage. */
export const VISITOR_HERO = {
  eyebrow: 'Ready infrastructure for AI agents',
  /**
   * Plain-text headline for analytics / a11y. The hero highlights the launch outcome.
   */
  headline: 'From idea to a product you can really launch.',
  /** Phrase painted with the marker animation inside the h1. */
  headlineHighlight: 'really launch',
  subhead:
    'A code base built for AI agents, with the foundations that usually stop projects before ship. One-time payment, $29.',
  primaryCtaLabel: `Get VybeKiit · ${PRICE.display}`,
  trustChips: [
    'Secure checkout via Lemon Squeezy',
    `${PRICE.refundDays}-day refund`,
    'Lifetime access',
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
  heading: 'You define the product. The agent assembles it.',
  steps: [
    {
      id: 'plan',
      title: 'Describe the idea',
      body: 'Tell the agent what the product does, who uses it, and what they need to do.',
      icon: 'plan',
      featured: false,
    },
    {
      id: 'build',
      title: 'Reuse ready pieces',
      body: 'The agent picks from sign-in, database, payments, email, dashboard, and deploy already in the kit.',
      icon: 'build',
      featured: false,
    },
    {
      id: 'wire',
      title: 'Fit it to your product',
      body: 'It adapts models, screens, and actions to your idea instead of inventing every feature from zero.',
      icon: 'wire',
      featured: false,
    },
    {
      id: 'verify',
      title: 'Check before launch',
      body: 'Structure that helps check main flows. You still review before real users.',
      icon: 'verify',
      featured: false,
    },
    {
      id: 'live',
      title: 'Go live and keep building',
      body: 'Ship to supported hosts and keep working on the same base after launch.',
      icon: 'live',
      featured: true,
    },
  ] as const satisfies readonly OperatorStep[],
} as const;

/** Problem / overview block copy. */
export const PROBLEM_OVERVIEW = {
  problemLabel: 'BEFORE VYBEKIIT',
  problemHeading: 'From a blank page, the agent reinvents the foundation every time.',
  problemBody:
    'Structure, sign-in, payments, webhooks, database, protected actions, deploy, and checks all become fresh decisions.',
  overviewTitle: 'From scratch',
  rows: [
    { id: 'payments', label: 'Payments', value: 'From zero', tone: 'muted' as const },
    { id: 'auth', label: 'Sign-in', value: 'New setup', tone: 'muted' as const },
    { id: 'database', label: 'Database', value: 'From zero', tone: 'muted' as const },
    { id: 'deploy', label: 'Deploy', value: 'Manual', tone: 'muted' as const },
    { id: 'you', label: 'You', value: 'Guessing', tone: 'danger' as const },
  ] as const,
} as const;

/** Solution / payments block copy. */
export const SOLUTION_PAYMENTS = {
  solutionLabel: 'WITH VYBEKIIT',
  solutionHeading: 'The base decisions are already made.',
  solutionBody:
    'The agent starts from a consistent structure, uses ready features, and focuses on what is unique in your product.',
  toastLabel: 'Payment received',
  revenueLabel: 'Revenue',
  revenueValue: '$2,841',
  revenueDelta: '+27.4% vs last 7 days',
} as const;

/** Three-platform bundle section. */
export const PLATFORMS_BUNDLE = {
  heading: 'One base for three product types',
  subhead: 'Shared foundation and examples for each environment.',
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
  /** LogoMarkIcon / brand-marks slug for the product mark. */
  readonly logoSlug: string;
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
  heading: 'Not an app generator. A professional base for the agent that builds them.',
  subhead:
    'Tools like Lovable build inside a managed platform. Classic starters hand you code and still expect you to wire it. VybeKiit sits in the middle: your code, a ready base, and instructions so the agent connects real foundations without reinventing them every project.',
  footnote:
    'Need a heavy team product with roles and admin tools on day one? MakerKit and Supastarter are stronger there. VybeKiit fits people who build with AI and do not want every project to restart as a new experiment in security, payments, and infrastructure.',
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
      logoSlug: 'vybekiit',
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
      logoSlug: 'shipfast',
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
      logoSlug: 'lovable',
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
      logoSlug: 'makerkit',
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
      logoSlug: 'supastarter',
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
      logoSlug: 'open-saas',
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
    'Source code + agent instructions',
    'Web, mobile, and browser-extension base',
    'Sign-in, payments, database, email, dashboard, 46+ screens',
    '14-day money-back window.',
  ] as const,
  ctaLabel: `Get VybeKiit · ${PRICE.display}`,
} as const;

/** FAQ section heading for the visitor homepage. */
export const VISITOR_FAQ = {
  heading: 'Common questions',
} as const;
