/**
 * All extension-landing copy and structure as typed `const`s — nav, hero,
 * feature badges, steps, feature cards, stats, FAQ, CTA, and footer. Sections
 * map these arrays with `.map()` (never pasted siblings). Brand placeholder is
 * `ExtenName`; copy is short generic functional-template placeholder text.
 *
 * `icon` fields are string keys resolved to lucide components in
 * `@/components/ui/IconRegistry`, so this module stays free of JSX/React.
 */

/** Brand placeholder shown across the page (logo, footer, copy). */
export const BRAND = {
  name: 'ExtenName',
  tagline: 'Browser Extension',
} as const;

/** Icon keys resolvable via the shared icon registry. */
export type IconKey =
  | 'zap'
  | 'shield'
  | 'mousePointerClick'
  | 'sparkles'
  | 'store'
  | 'rocket'
  | 'bookmark'
  | 'bolt'
  | 'lineChart'
  | 'settings'
  | 'lock'
  | 'twitter'
  | 'github'
  | 'discord';

/** One header nav link (anchors to in-page sections). */
export interface NavLink {
  readonly href: string;
  readonly label: string;
}

/** Header navigation — matches the reference top bar order. */
export const NAV_LINKS: readonly NavLink[] = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#support', label: 'Support' },
];

/** Primary install target shown as the nav / hero solid CTA. */
export const PRIMARY_CTA = { label: 'Add to Chrome', href: '#install' } as const;

/** Hero copy: eyebrow, split headline, subhead, rating, and trust chips. */
export const HERO = {
  eyebrow: 'Lightweight. Fast. Secure.',
  headline: 'Supercharge your browser.',
  headlineAccent: 'Get more done.',
  subhead:
    'ExtenName helps you save time, stay focused, and boost productivity — right from your browser.',
  rating: '4.9',
  ratingSuffix: '12,560+ users',
  trustChips: ['Free to use', 'No signup required', 'Works offline'] as const,
} as const;

/** One add-to-browser CTA button (browser logo + label + variant). */
export interface BrowserCta {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly browser: 'chrome' | 'edge';
  readonly variant: 'default' | 'outline';
}

/** The two install buttons used in the hero and the closing CTA band. */
export const BROWSER_CTAS: readonly BrowserCta[] = [
  {
    key: 'chrome',
    label: 'Add to Chrome',
    href: '#install',
    browser: 'chrome',
    variant: 'default',
  },
  { key: 'edge', label: 'Add to Edge', href: '#install', browser: 'edge', variant: 'outline' },
];

/** One feature badge in the 4-up strip below the hero. */
export interface FeatureBadge {
  readonly key: string;
  readonly icon: IconKey;
  readonly title: string;
  readonly description: string;
}

export const FEATURE_BADGES: readonly FeatureBadge[] = [
  {
    key: 'fast',
    icon: 'zap',
    title: 'Lightning Fast',
    description: 'Built for speed and performance.',
  },
  {
    key: 'privacy',
    icon: 'shield',
    title: 'Privacy First',
    description: 'Your data stays with you. Always.',
  },
  {
    key: 'easy',
    icon: 'mousePointerClick',
    title: 'Easy to Use',
    description: 'Simple interface that just makes sense.',
  },
  {
    key: 'improving',
    icon: 'sparkles',
    title: 'Always Improving',
    description: 'Regular updates with new features.',
  },
];

/** How-it-works section heading + eyebrow. */
export const HOW_IT_WORKS = {
  eyebrow: 'HOW IT WORKS',
  heading: 'Get started in 3 simple steps',
  linkLabel: 'SEE IT IN ACTION',
  linkHref: '#install',
} as const;

/** One numbered step in the how-it-works row. */
export interface HowStep {
  readonly key: string;
  readonly step: string;
  readonly icon: IconKey;
  readonly title: string;
  readonly description: string;
}

export const HOW_STEPS: readonly HowStep[] = [
  {
    key: 'add',
    step: '1',
    icon: 'store',
    title: 'Add to your browser',
    description: 'Install ExtenName in seconds.',
  },
  {
    key: 'pin',
    step: '2',
    icon: 'sparkles',
    title: 'Pin & customize',
    description: 'Pin the extension and set it up your way.',
  },
  {
    key: 'boost',
    step: '3',
    icon: 'rocket',
    title: 'Boost productivity',
    description: 'Start saving time and getting more done.',
  },
];

/** Feature-grid section heading. */
export const FEATURE_GRID = {
  heading: 'Everything you need, right in your browser',
} as const;

/** One feature card in the 3-up grid. */
export interface FeatureCard {
  readonly key: string;
  readonly icon: IconKey;
  readonly title: string;
  readonly description: string;
}

export const FEATURE_CARDS: readonly FeatureCard[] = [
  {
    key: 'capture',
    icon: 'bookmark',
    title: 'Quick capture & save',
    description: 'Capture, organize, and access any content instantly.',
  },
  {
    key: 'focus',
    icon: 'bolt',
    title: 'Focus mode',
    description: 'Block distractions and stay in the zone.',
  },
  {
    key: 'insights',
    icon: 'lineChart',
    title: 'Detailed insights',
    description: 'Track your progress with beautiful analytics.',
  },
];

/** Trusted-by stats section heading. */
export const TRUSTED_STATS = {
  heading: 'Trusted by thousands of productivity lovers',
} as const;

/** One stat tile in the trust bar. */
export interface StatTile {
  readonly key: string;
  /** Numeric value drives the count-up; string values render as-is. */
  readonly value: number | string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly label: string;
  /** Show a 5-star row above the value (store-rating tiles). */
  readonly rated?: boolean;
}

export const STAT_TILES: readonly StatTile[] = [
  { key: 'users', value: 12, suffix: 'K+', label: 'Active Users' },
  { key: 'chrome', value: '4.8', label: 'Chrome Web Store', rated: true },
  { key: 'edge', value: '4.9', label: 'Edge Add-on', rated: true },
  { key: 'editors', value: "Editor's Choice", label: 'Chrome Web Store' },
];

/** FAQ section heading. */
export const FAQ = {
  eyebrow: 'FAQ',
  heading: 'Frequently asked questions',
} as const;

/** One FAQ entry. */
export interface FaqItem {
  readonly key: string;
  readonly question: string;
  readonly answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    key: 'free',
    question: 'Is ExtenName free to use?',
    answer: 'Yes. ExtenName is free to install and use, with no hidden fees.',
  },
  {
    key: 'sites',
    question: 'Does it work on all websites?',
    answer: 'ExtenName works across the sites you browse every day, right out of the box.',
  },
  {
    key: 'safe',
    question: 'Is my data safe?',
    answer: 'Your data stays on your device — we never collect or sell personal information.',
  },
  {
    key: 'devices',
    question: 'Can I use it on multiple devices?',
    answer: 'Install ExtenName on every browser you use and pick up right where you left off.',
  },
];

/** Privacy callout beside the FAQ. */
export const PRIVACY_CALLOUT = {
  title: 'Your privacy matters',
  body: "We don't collect or share your personal data. See how we keep you safe.",
  linkLabel: 'Read our Privacy Policy',
  linkHref: '#privacy',
} as const;

/** Closing accent CTA band copy. */
export const READY_CTA = {
  heading: 'Ready to boost your productivity?',
  subhead: 'Join thousands of users and supercharge your browser today.',
} as const;

/** One footer link. */
export interface FooterLink {
  readonly key: string;
  readonly label: string;
  readonly href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  { key: 'privacy', label: 'Privacy Policy', href: '#privacy' },
  { key: 'terms', label: 'Terms of Service', href: '#terms' },
  { key: 'support', label: 'Support', href: '#support' },
  { key: 'contact', label: 'Contact', href: '#contact' },
];

/** One footer social icon link. */
export interface SocialLink {
  readonly key: string;
  readonly icon: IconKey;
  readonly label: string;
  readonly href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { key: 'twitter', icon: 'twitter', label: 'Twitter', href: '#twitter' },
  { key: 'github', icon: 'github', label: 'GitHub', href: '#github' },
  { key: 'discord', icon: 'discord', label: 'Discord', href: '#discord' },
];

/** Footer copyright line. */
export const FOOTER_COPYRIGHT = '© 2026 ExtenName. All rights reserved.';

/** Extension dashboard mock (children of the hero BrowserWindow). */
export const DASHBOARD = {
  title: 'ExtenName',
  summaryLabel: "Today's Summary",
  headlineValue: 18,
  headlineCaption: 'Tasks completed',
} as const;

/** One list row in the extension dashboard mock. */
export interface DashboardRow {
  readonly key: string;
  readonly icon: IconKey;
  readonly label: string;
  /** Renders a trailing badge count. */
  readonly badge?: string;
  /** Renders a trailing switch; the boolean is its default checked state. */
  readonly toggle?: boolean;
}

export const DASHBOARD_ROWS: readonly DashboardRow[] = [
  { key: 'actions', icon: 'bolt', label: 'Quick Actions' },
  { key: 'saved', icon: 'bookmark', label: 'Saved Items', badge: '24' },
  { key: 'focus', icon: 'sparkles', label: 'Focus Mode', toggle: true },
  { key: 'stats', icon: 'lineChart', label: 'Statistics' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
];

/** Sparkline series for the dashboard mock chart. */
export const DASHBOARD_SPARKLINE: readonly { readonly x: string; readonly y: number }[] = [
  { x: 'mon', y: 6 },
  { x: 'tue', y: 9 },
  { x: 'wed', y: 7 },
  { x: 'thu', y: 12 },
  { x: 'fri', y: 10 },
  { x: 'sat', y: 15 },
  { x: 'sun', y: 18 },
];
