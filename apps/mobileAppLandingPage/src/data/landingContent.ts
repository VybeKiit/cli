import type { LucideIcon } from 'lucide-react';
import { Bell, Heart, LayoutGrid, ListChecks, Settings2, TrendingUp } from 'lucide-react';

/**
 * All copy + structured data for the mobile-app landing page, kept as typed
 * `const` objects/arrays so every section maps over data instead of pasting
 * sibling JSX (CODE-STYLE: repeated rows → data array + `.map()`). Swap the brand
 * by editing {@link APP_NAME}; it is referenced everywhere the product is named.
 */

/** Placeholder brand name referenced across the whole page. */
export const APP_NAME = 'AppName';

/** Top-nav links, mapped in `SiteHeader` (desktop + mobile). */
export const NAV_LINKS = [
  { key: 'explore', label: 'Explore', href: '#features' },
  { key: 'how', label: 'How it works', href: '#how' },
  { key: 'pricing', label: 'Pricing', href: '#pricing' },
  { key: 'support', label: 'Support', href: '#faq' },
] as const satisfies readonly { key: string; label: string; href: string }[];

/** Primary header CTA — target anchor + label, shared by the desktop and mobile buttons. */
export const HEADER_CTA = { href: '#download', label: 'Download App' } as const;

/** Hero eyebrow, headline, subhead, primary CTA copy, and rating line. */
export const HERO = {
  eyebrow: 'Designed for mobile-first',
  headlineLead: 'Everything you need.',
  headlineRestLead: 'All in one ',
  headlineHighlight: 'app',
  subhead:
    'Simply your day, stay organized, and focus on what matters. Download AppName and experience the difference.',
  ratingValue: '4.9',
  ratingCount: '200 Ratings',
  ratingStars: 5,
} as const;

/** Category rows shown inside the phone dashboard "Explore" list. */
export type DashboardCategory = {
  readonly key: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

/** "Explore" category rows for the rebuilt in-phone app dashboard. */
export const DASHBOARD_CATEGORIES = [
  { key: 'fitness', label: 'Fitness', icon: TrendingUp },
  { key: 'wellness', label: 'Wellness', icon: Heart },
  { key: 'planning', label: 'Planning', icon: ListChecks },
  { key: 'reminders', label: 'Reminders', icon: Bell },
] as const satisfies readonly DashboardCategory[];

/** KPI tiles shown under the dashboard "Insights" chart. */
export const DASHBOARD_KPIS = [
  { key: 'streak', label: 'Day streak', value: '12' },
  { key: 'tasks', label: 'Tasks done', value: '48' },
] as const satisfies readonly { key: string; label: string; value: string }[];

/** Weekly series for the dashboard "Insights" line chart. */
export const DASHBOARD_TREND = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 18 },
  { day: 'Wed', value: 15 },
  { day: 'Thu', value: 24 },
  { day: 'Fri', value: 21 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 27 },
] as const satisfies readonly { day: string; value: number }[];

/** Feature card model for the "Powerful features" grid. */
export type FeatureCard = {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
};

/** Feature grid heading + four cards, mapped in `FeatureGrid`. */
export const FEATURES_HEADING = {
  title: 'Powerful features. Simple experience.',
  subtitle: 'Everything you need to reach your goals, in one place.',
} as const;

/** The four feature cards below the hero. */
export const FEATURES = [
  {
    key: 'organized',
    title: 'Stay Organized',
    description: 'Keep everything in one place and never lose track of what matters most.',
    icon: LayoutGrid,
  },
  {
    key: 'progress',
    title: 'Track Progress',
    description: 'Watch your streaks grow with clear, motivating insights every day.',
    icon: TrendingUp,
  },
  {
    key: 'reminders',
    title: 'Smart Reminders',
    description: 'Gentle nudges at the right time so nothing slips through the cracks.',
    icon: Bell,
  },
  {
    key: 'customize',
    title: 'Customize It',
    description: 'Make it yours with flexible themes, layouts, and personal settings.',
    icon: Settings2,
  },
] as const satisfies readonly FeatureCard[];

/** Testimonial card model. */
export type Testimonial = {
  readonly key: string;
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
  readonly stars: number;
};

/** Testimonials heading + three cards, mapped in `Testimonials`. */
export const TESTIMONIALS_HEADING = {
  title: 'Loved by users worldwide',
} as const;

/** Three testimonial cards. */
export const TESTIMONIALS = [
  {
    key: 'jamie',
    quote:
      'This app has completely changed the way I plan my day. I get more done and stress less.',
    name: 'Jamie L.',
    role: 'Product Designer',
    initials: 'JL',
    stars: 5,
  },
  {
    key: 'priya',
    quote: 'The reminders are perfectly timed and the insights keep me motivated week after week.',
    name: 'Priya S.',
    role: 'Founder',
    initials: 'PS',
    stars: 5,
  },
  {
    key: 'marcus',
    quote: 'Simple, fast, and beautiful. It is the first habit app that actually stuck for me.',
    name: 'Marcus T.',
    role: 'Engineer',
    initials: 'MT',
    stars: 5,
  },
] as const satisfies readonly Testimonial[];

/** FAQ heading + items, mapped into the `Accordion` in `Faq`. */
export const FAQ_HEADING = {
  title: 'Frequently asked questions',
  asideTitle: 'Your privacy matters',
  asideBody:
    'Your data stays yours. We never sell your information and you can export or delete it anytime.',
} as const;

/** Accordion items for the FAQ section. */
export const FAQ_ITEMS = [
  {
    key: 'free',
    question: 'Is AppName free to use?',
    answer: 'Yes. Core features are free forever. A Pro plan unlocks advanced insights and themes.',
  },
  {
    key: 'offline',
    question: 'Does it work offline?',
    answer: 'Absolutely. Your data syncs automatically the next time you reconnect.',
  },
  {
    key: 'devices',
    question: 'Can I use it across devices?',
    answer: 'Sign in once and your account stays in sync across phone, tablet, and web.',
  },
  {
    key: 'cancel',
    question: 'Can I cancel anytime?',
    answer: 'Of course. Manage or cancel your plan from settings in a couple of taps.',
  },
] as const satisfies readonly { key: string; question: string; answer: string }[];

/** Full-width download CTA band copy. */
export const DOWNLOAD_CTA = {
  title: 'Download AppName today',
  subtitle: 'Join thousands of people building better habits, one day at a time.',
} as const;

/** Footer link column model. */
export type FooterColumn = {
  readonly key: string;
  readonly title: string;
  readonly links: readonly {
    readonly key: string;
    readonly label: string;
    readonly href: string;
  }[];
};

/** Footer link columns, mapped in `SiteFooter`. */
export const FOOTER_COLUMNS = [
  {
    key: 'product',
    title: 'Product',
    links: [
      { key: 'features', label: 'Features', href: '#features' },
      { key: 'pricing', label: 'Pricing', href: '#pricing' },
      { key: 'download', label: 'Download', href: '#download' },
    ],
  },
  {
    key: 'company',
    title: 'Company',
    links: [
      { key: 'about', label: 'About', href: '#' },
      { key: 'blog', label: 'Blog', href: '#' },
      { key: 'careers', label: 'Careers', href: '#' },
    ],
  },
  {
    key: 'legal',
    title: 'Legal',
    links: [
      { key: 'privacy', label: 'Privacy', href: '#' },
      { key: 'terms', label: 'Terms', href: '#' },
      { key: 'support', label: 'Support', href: '#faq' },
    ],
  },
] as const satisfies readonly FooterColumn[];
