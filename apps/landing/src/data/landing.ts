/**
 * Cinematic landing page copy and structure — nav, hero, carousel metadata,
 * zig-zag rows, feature strip, and tech stack marks. Pricing constants live in
 * `site.ts`; FAQ answers are pulled from `faq.ts` at render time.
 */

/** One header nav link. */
export interface LandingNavLink {
  readonly href: string;
  readonly label: string;
}

/** Header navigation — anchors to in-page sections. */
export const LANDING_NAV: readonly LandingNavLink[] = [
  { href: '#showcase', label: 'Operator' },
  { href: '#showcase', label: 'Web' },
  { href: '#showcase', label: 'Mobile' },
  { href: '#showcase', label: 'Extension' },
  { href: '#pricing', label: "What's Included" },
  { href: '#showcase', label: 'Showcase' },
  { href: '#faq', label: 'FAQ' },
];

/** Hero section copy. */
export const LANDING_HERO = {
  label: 'AI OPERATOR + WEB, MOBILE, EXTENSION BUNDLE',
  headlineLines: ['Your entire stack.', 'Operated by AI.'] as const,
  subhead:
    'Launch and scale your product with an AI operator that runs the work so you can focus on growth.',
  ctaLabel: 'Get VybeKiit',
} as const;

/** One feature-strip item beneath the hero. */
export interface FeatureStripItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: 'operator' | 'web' | 'mobile' | 'extension' | 'price';
}

export const FEATURE_STRIP: readonly FeatureStripItem[] = [
  { id: 'operator', title: 'AI Operator', subtitle: 'Works while you sleep', icon: 'operator' },
  { id: 'web', title: 'Web App', subtitle: 'Production-ready', icon: 'web' },
  { id: 'mobile', title: 'Mobile App', subtitle: 'iOS & Android', icon: 'mobile' },
  {
    id: 'extension',
    title: 'Browser Extension',
    subtitle: 'Ship everywhere',
    icon: 'extension',
  },
  { id: 'price', title: 'One-Time Price', subtitle: 'Yours forever', icon: 'price' },
];

/** Carousel slide metadata — component mapping lives in ShowcaseCarousel. */
export interface ShowcaseSlideMeta {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export const SHOWCASE_SECTION = {
  heading: 'One bundle Every surface',
  subtext: 'Web mobile extension and operator components — already wired',
} as const;

export const SHOWCASE_SLIDES: readonly ShowcaseSlideMeta[] = [
  { id: 'operator', title: 'AI Operator', subtitle: 'Automate. Respond. Resolve.' },
  { id: 'web', title: 'Web App', subtitle: 'Launch a polished product.' },
  { id: 'mobile', title: 'Mobile App', subtitle: 'iOS & Android. Native feel.' },
  {
    id: 'extension',
    title: 'Browser Extension',
    subtitle: "Power in your users' workflow.",
  },
  { id: 'marketing', title: 'Web App', subtitle: 'Everything you need to ship.' },
];

/** Problem/solution copy block inside a zig-zag row. */
export interface ZigZagCopyBlock {
  readonly problemLabel: string;
  readonly problemHeading: string;
  readonly problemBody: string;
  readonly solutionLabel: string;
  readonly solutionHeading: string;
  readonly solutionBody: string;
}

/** One zig-zag row configuration. */
export interface ZigZagRow {
  readonly id: string;
  readonly copy: ZigZagCopyBlock;
  /** UI mock sits on the right when true, left when false. */
  readonly uiOnRight: boolean;
  readonly mock: 'operator' | 'payments' | 'three-device';
}

export const ZIGZAG_ROWS: readonly ZigZagRow[] = [
  {
    id: 'operator',
    uiOnRight: true,
    mock: 'operator',
    copy: {
      problemLabel: 'THE PROBLEM',
      problemHeading: 'Boilerplates still leave you holding the bag.',
      problemBody:
        'You still have to wire auth, payments, databases, emails, analytics, and more. Days disappear.',
      solutionLabel: 'THE SOLUTION',
      solutionHeading: 'VybeKiit operates the stack.',
      solutionBody:
        'Our AI operator configures, connects, and keeps everything running—end to end.',
    },
  },
  {
    id: 'payments',
    uiOnRight: false,
    mock: 'payments',
    copy: {
      problemLabel: 'THE PROBLEM',
      problemHeading: 'Payments setup kills momentum.',
      problemBody: "Integrations, webhooks, taxes, invoices—it's a rabbit hole.",
      solutionLabel: 'THE SOLUTION',
      solutionHeading: 'Payments foundation is already wired.',
      solutionBody:
        'Checkout, webhooks, and post-payment access ship as a connected base the agent can adapt.',
    },
  },
  {
    id: 'platforms',
    uiOnRight: true,
    mock: 'three-device',
    copy: {
      problemLabel: 'THE PROBLEM',
      problemHeading: 'Maintaining multiple platforms drains time.',
      problemBody: 'Web here. Mobile there. Extension somewhere else. Every update costs you.',
      solutionLabel: 'THE SOLUTION',
      solutionHeading: 'Ship web, mobile, and extension together.',
      solutionBody: 'One codebase. One operator. Everywhere your users are.',
    },
  },
];

/** Pricing CTA bullet lines. */
export const PRICING_BULLETS: readonly string[] = [
  'AI Operator + Web + Mobile + Extension',
  'All features. No limits.',
  'Lifetime access. Yours forever.',
  '14-day money-back guarantee.',
];

/** Social proof taglines. */
export const SOCIAL_PROOF = {
  tagline: 'Join founders shipping faster with VybeKiit.',
  subtagline: 'Build less. Ship more.',
} as const;

/** Builder-tool wordmarks for hero orbit — assistants + dev toolchain only. */
export interface BuilderToolMark {
  readonly label: string;
  readonly slug: string;
  readonly hoverColor: string;
}

export const BUILDER_TOOL_MARKS: readonly BuilderToolMark[] = [
  { label: 'Cursor', slug: 'cursor', hoverColor: '#FFFFFF' },
  { label: 'Claude Code', slug: 'claude', hoverColor: '#D97757' },
  { label: 'Codex', slug: 'codex', hoverColor: '#7B8CFF' },
  { label: 'GitHub', slug: 'github', hoverColor: '#FFFFFF' },
  { label: 'Figma', slug: 'figma', hoverColor: '#F24E1E' },
  { label: 'TypeScript', slug: 'typescript', hoverColor: '#3178C6' },
  { label: 'Node.js', slug: 'nodedotjs', hoverColor: '#339933' },
  { label: 'Playwright', slug: 'playwright', hoverColor: '#2EAD33' },
];

/** Product-stack wordmarks for pricing auto-scroll row — shipped app defaults + adapters. */
export interface ProductStackMark {
  readonly label: string;
  readonly slug: string;
  readonly hoverColor: string;
}

export const PRODUCT_STACK_MARKS: readonly ProductStackMark[] = [
  { label: 'NEXT.js', slug: 'nextdotjs', hoverColor: '#FFFFFF' },
  { label: 'tailwindcss', slug: 'tailwindcss', hoverColor: '#06B6D4' },
  { label: 'TypeScript', slug: 'typescript', hoverColor: '#3178C6' },
  { label: 'React', slug: 'react', hoverColor: '#61DAFB' },
  { label: 'shadcn/ui', slug: 'shadcn', hoverColor: '#FFFFFF' },
  { label: 'supabase', slug: 'supabase', hoverColor: '#3FCF8E' },
  { label: 'Cloudflare', slug: 'cloudflare', hoverColor: '#F38020' },
  { label: 'Lemon Squeezy', slug: 'lemonsqueezy', hoverColor: '#FFC233' },
  { label: 'better-auth', slug: 'betterauth', hoverColor: '#FFFFFF' },
  { label: 'OpenAI', slug: 'openai', hoverColor: '#FFFFFF' },
  { label: 'Expo', slug: 'expo', hoverColor: '#FFFFFF' },
  { label: 'WXT', slug: 'wxt', hoverColor: '#FFFFFF' },
  { label: 'Sonner', slug: 'sonner', hoverColor: '#FFFFFF' },
  { label: 'resend', slug: 'resend', hoverColor: '#FFFFFF' },
  { label: 'stripe', slug: 'stripe', hoverColor: '#635BFF' },
  { label: 'PayPal', slug: 'paypal', hoverColor: '#00457C' },
  { label: 'Vercel', slug: 'vercel', hoverColor: '#FFFFFF' },
  { label: 'AWS', slug: 'amazonaws', hoverColor: '#FF9900' },
  { label: 'MongoDB', slug: 'mongodb', hoverColor: '#47A248' },
  { label: 'Google', slug: 'google', hoverColor: '#4285F4' },
  { label: 'Sentry', slug: 'sentry', hoverColor: '#362D59' },
  { label: 'Plausible', slug: 'plausible', hoverColor: '#5850EC' },
  { label: 'Chrome', slug: 'googlechrome', hoverColor: '#4285F4' },
  { label: 'App Store', slug: 'appstore', hoverColor: '#FFFFFF' },
  { label: 'Google Play', slug: 'googleplay', hoverColor: '#34A853' },
];

/** FAQ entry ids to show on the dark cinematic landing (from faq.ts). */
export const LANDING_FAQ_IDS = [
  'which-package',
  'vibe-coder',
  'best-for-non-technical',
  'only-need-web',
  'vs-shipfast-lovable',
  'price-worth-it',
  'claude-cursor-kiro',
  'refund-risk',
  'taxes-payments',
] as const;

/** Framer Motion easing shared across landing animations. */
export const LANDING_EASE = [0.16, 1, 0.3, 1] as const;
