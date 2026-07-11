import { FAQ } from '@/data/faq';
import type { LandingMessages } from '@/i18n/messages/types';

/**
 * English (source) visitor landing copy.
 * Positioning: ready infrastructure for AI agents, not “money in session one.”
 * FAQ items import from `data/faq` so JSON-LD and UI stay one SSOT.
 */
export const enMessages: LandingMessages = {
  meta: {
    languageName: 'English',
    switchLanguage: 'Language',
    closeLanguageMenu: 'Close language menu',
  },
  nav: {
    features: 'What you get',
    howItWorks: 'How it works',
    compare: 'Compare',
    pricing: 'Pricing',
    faq: 'FAQ',
    getVybekiit: 'Get VybeKiit',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  footer: {
    rights: 'All rights reserved.',
    legal: 'Legal',
    contact: 'Contact',
    compare: 'Compare kits',
    brand: 'Brand',
    terms: 'Terms',
    privacy: 'Privacy',
  },
  hero: {
    eyebrow: 'Ready infrastructure for AI agents',
    headlineBefore: 'From idea to a product you can ',
    headlineHighlight: 'really launch',
    headlineAfter: '.',
    subheadBeforePrice:
      'A code base built for AI agents, with the foundations that usually stop projects before ship: sign-in, database, payments, email, dashboard, monitoring, and deploy already connected in a clear structure. One-time payment, ',
    subheadAfterPrice: '.',
    primaryCta: 'Get VybeKiit',
    trustMoR: 'Secure checkout via Lemon Squeezy',
    trustRefund: 'day refund',
    trustPlatforms: 'Lifetime access',
    trustAria: 'Trust promises',
  },
  geoLead: {
    ariaLabel: 'Product definition',
    brandStrong: 'VybeKiit',
    beforePrice: ' is a ',
    afterPrice:
      ' one-time kit for AI coding agents: owned source with sign-in, database, payments, email, and web + mobile + extension bases.',
    compareLink: 'Compare kits',
    midLinks: ' · ',
    foundersLink: 'For non-technical founders',
    andWord: ' · ',
    vibeLink: 'Vibe coding SaaS',
    end: '',
  },
  builtWith: {
    note: 'this entire landing page was built with VybeKiit',
  },
  techTrust: {
    agentsHeading: 'Works with the AI tools you already use',
    stackHeading: 'Built with familiar technologies. The code stays yours.',
  },
  operator: {
    heading: 'You define the product. The agent assembles it.',
    steps: [
      {
        id: 'plan',
        title: 'Describe the idea',
        body: 'Tell the agent what the product does, who uses it, and what they need to do. No tech document required.',
      },
      {
        id: 'build',
        title: 'Reuse ready pieces',
        body: 'The agent picks from what is already in VybeKiit: sign-in, database, payments, email, users, dashboard, settings, analytics, monitoring, and deploy.',
      },
      {
        id: 'wire',
        title: 'Fit it to your product',
        body: 'It adapts models, screens, and actions to your idea instead of inventing every feature from a blank page.',
      },
      {
        id: 'verify',
        title: 'Check before launch',
        body: 'The structure helps the agent check main flows, access, payments, and important actions. You still review before real users. VybeKiit reduces the work. It does not replace judgment.',
      },
      {
        id: 'live',
        title: 'Go live and keep building',
        body: 'Ship to supported hosts and keep working on the same base after launch.',
      },
    ],
  },
  vibeStory: {
    label: 'THE REALITY',
    heading: 'Vibe coding starts fast. Shipping is the hard part.',
    lead: 'AI can draft a first screen in minutes. Real users, payments, permissions, and a stable go-live still stop most projects — not the idea, the missing product base.',
    stages: [
      {
        id: 'magic',
        title: 'Users and data?',
        body: 'Who signs in, what is stored, who can see what.',
      },
      {
        id: 'mess',
        title: 'Payments done right?',
        body: 'Checkout, webhooks, access after pay.',
      },
      {
        id: 'paste',
        title: 'Sensitive parts safe?',
        body: 'Guarded pages and secrets, without leaking keys.',
      },
      {
        id: 'stall',
        title: 'Ship and stay live?',
        body: 'Deploy cleanly and notice when something breaks.',
      },
    ],
    bottomLine:
      'VybeKiit does not replace your agent. It hands the agent a ready base so it builds product, not infrastructure from zero.',
    softCta: 'You focus on the idea and users. The agent builds on a solid base.',
    cta: 'Get VybeKiit',
  },
  problem: {
    problemLabel: 'BEFORE VYBEKIIT',
    problemHeading: 'From a blank page, the agent reinvents the foundation every time.',
    problemBody:
      'Sign-in, payments, data, deploy, and checks start as fresh guesses. Each one is another place things break.',
    overviewTitle: 'From scratch',
    withoutBadge: 'Blank start',
    rows: [
      { id: 'payments', label: 'Payments', value: 'From zero' },
      { id: 'auth', label: 'Sign-in', value: 'New setup' },
      { id: 'database', label: 'Database', value: 'From zero' },
      { id: 'deploy', label: 'Deploy', value: 'Manual' },
      { id: 'you', label: 'You', value: 'Guessing' },
    ],
  },
  solution: {
    solutionLabel: 'WITH VYBEKIIT',
    solutionHeading: 'The core features are already built in.',
    solutionBody:
      'The agent starts from a consistent structure, uses ready features, and focuses on what is unique in your product. Connected payments, clear flows, and room to keep shipping after go-live.',
    toastLabel: 'Payment received',
    revenueLabel: 'Revenue',
    revenueDelta: '+27.4% vs last 7 days',
  },
  zigZag: {
    auth: {
      label: 'SIGN-IN RECIPE',
      heading: 'Login is already a real product page, not a blank prompt.',
      body: 'Google OAuth, magic link, and a signed-in session. The agent adapts the screen. You do not rebuild auth from a sketch every project.',
      welcomeBack: 'Welcome back',
      signInSubtitle: 'Sign in to your workspace',
      googleCta: 'Continue with Google',
      orEmail: 'or email',
      emailPlaceholder: 'you@studio.com',
      magicLink: 'Sign in with magic link',
      signingIn: 'Signing in with Google…',
      successTitle: 'You are in',
      successBody: 'Session ready. Protected routes unlock next.',
      signedInAs: 'ava@studio.com',
    },
    settings: {
      label: 'SETTINGS RECIPE',
      heading: 'User settings people expect on day one.',
      body: 'Profile, security, billing, and team rails ship as a connected flow. The agent fills your fields. You are not inventing the account area from zero.',
      navProfile: 'Profile',
      navSecurity: 'Security',
      navBilling: 'Billing',
      navTeam: 'Team',
      userName: 'Ava Stone',
      userEmail: 'ava@studio.com',
      nameLabel: 'Display name',
      roleLabel: 'Role',
      roleValue: 'Product designer',
      darkMode: 'Dark mode',
      darkModeHint: 'Match system or force a theme',
      saveCta: 'Save changes',
      saved: 'Saved',
      readyBadge: 'Ready',
    },
    race: {
      label: 'THE BUILD RACE',
      heading: 'Same vibe coder. Different starting line.',
      body: 'Without a base, pure vibe coding often surges ahead, then freezes on payments and integrations. With VybeKiit the start is slower, but the path is complete.',
      withoutTitle: 'Without VybeKiit',
      withTitle: 'With VybeKiit',
      building: 'Building',
      stuck: 'Stuck',
      finished: 'Shipped',
      steps: [
        'First screens look done',
        'Sign-in and sessions',
        'Payments and integrations',
        'Protect sensitive actions',
        'Deploy and stay live',
      ],
    },
  },
  platforms: {
    heading: 'One base for three product types',
    subhead:
      'Not every feature is identical on every platform. VybeKiit gives a shared foundation and examples for each environment.',
    web: 'Web',
    mobile: 'Mobile',
    extension: 'Extension',
    mockOverview: 'Overview',
    mockTransactions: 'Transactions',
    mockCustomers: 'Customers',
    mockActive: 'Active',
    mockRefunds: 'Refunds',
    mockRevenueDelta: '+27.4% vs last 7 days',
  },
  pageRecipes: {
    headline: '{readyCount}+ ready product screens the agent can take and adapt',
    badge: 'More added over time · One purchase covers included versions',
    body: 'Not only loose components. Full flows the agent can copy, change, and connect: onboarding, login, dashboard, pricing, checkout, orders, customers, analytics, AI assistant, settings, team, admin, billing, and more. New screens keep landing after you buy.',
    catalogLabel: 'Full screen catalog · {count} pages',
    catalogAria: 'Built-in product screen catalog',
    readyBadge: 'READY',
  },
  checkout: {
    titlePrefix: 'Get VybeKiit',
    description:
      'Enter the GitHub account we should invite, then continue to secure payment. Access unlocks when payment goes through.',
    bulletFull: 'Source code, agent instructions, web + mobile + extension base',
    bulletOnce: 'One-time price, not a subscription',
    bulletRefund: 'Money-back window: {days} days',
    githubLabel: 'GitHub username',
    githubPlaceholder: 'octocat',
    githubError: 'Enter a valid GitHub username (letters, numbers, single hyphens).',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    emailError: 'Enter a valid email address.',
    submit: 'Continue to payment',
    secureNote: 'Secure checkout via Lemon Squeezy.',
    refundNote: 'Money back within {days} days, per refund terms.',
  },
  compare: {
    heading: 'Not an app generator. A ready base packed with features for your agent.',
    subhead:
      'Tools like Lovable build inside a managed platform. Classic starters give you code and still expect you to understand and wire everything. VybeKiit sits in the middle: the code is yours, the agent does most of the connection work, the architecture and base features are ready, and you are not locked to one editor or host.',
    footnote:
      'Need a heavy team product with roles and admin tools on day one? MakerKit and Supastarter are stronger there. VybeKiit fits people who build with AI and do not want every project to restart as a new experiment in security, payments, and infrastructure.',
    optionColumn: 'Option',
    youBadge: 'You',
    axes: {
      price: 'Price',
      agentOperates: 'Agent starts from a ready base',
      plainLanguage: 'Clear instructions for the agent',
      updatesInstall: 'Consistent structure for updates',
      threePlatforms: 'Web + mobile + extension base',
      taxesHandled: 'Taxes handled on purchase (MoR)',
    },
    coverage: {
      yes: 'Yes',
      partial: 'Partial',
      no: 'No',
    },
  },
  pricing: {
    cadence: 'One-time payment · yours for life',
    savingsBefore: 'Save ',
    savingsAfter:
      '% vs buying site + phone + browser add-on packages alone · Every purchase raises the price',
    bullets: [
      'Source code + agent instructions',
      'Web, mobile, and browser-extension base',
      'Sign-in, payments, database, email, dashboard, 46+ screens',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: '-day money-back window.',
    cta: 'Get VybeKiit',
  },
  faq: {
    heading: 'Common questions',
    items: FAQ.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  },
  brand: {
    tagline: 'Ready infrastructure for products built with AI.',
  },
};
