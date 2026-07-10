import type { LandingMessages } from '@/i18n/messages/types';

/** English (source) visitor landing copy. */
export const enMessages: LandingMessages = {
  meta: {
    languageName: 'English',
    switchLanguage: 'Language',
    closeLanguageMenu: 'Close language menu',
  },
  nav: {
    features: 'Features',
    howItWorks: 'How it works',
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
    terms: 'Terms',
    privacy: 'Privacy',
  },
  hero: {
    eyebrow: 'You direct. The agent builds.',
    headlineBefore: 'Go live, and take ',
    headlineHighlight: 'your first payment',
    headlineAfter: ', in session one.',
    subheadBeforePrice:
      'Describe it in plain language. The agent wires payments, auth, database, and deploy across web, mobile, and a browser extension. One purchase, ',
    subheadAfterPrice: '.',
    primaryCta: 'Get VybeKiit',
    trustMoR: 'Lemon Squeezy · Merchant of Record',
    trustRefund: 'day refund',
    trustPlatforms: 'Web · Mobile · Extension',
    trustAria: 'Trust promises',
  },
  builtWith: {
    note: 'this entire landing page was built with VybeKiit',
  },
  techTrust: {
    agentsHeading: 'Works with the AI coding agents you already use',
    stackHeading: 'Built with the tools you already trust',
  },
  operator: {
    heading: 'One agent operates the whole stack.',
    steps: [
      {
        id: 'plan',
        title: 'Plan',
        body: 'Turn your idea into a clear plan and data model.',
      },
      {
        id: 'build',
        title: 'Build',
        body: 'Generate the full app across web, mobile, and extension.',
      },
      {
        id: 'wire',
        title: 'Wire',
        body: 'Connect payments, auth, database, and env config.',
      },
      {
        id: 'verify',
        title: 'Verify',
        body: 'Run checks, tests, and security verifications.',
      },
      {
        id: 'live',
        title: 'Live',
        body: 'Deploy everything. You go live in session one.',
      },
    ],
  },
  problem: {
    problemLabel: 'THE PROBLEM',
    problemHeading: 'Boilerplates still leave you holding the bag.',
    problemBody: 'VybeKiit operates the stack, end to end.',
    overviewTitle: 'Overview',
    withoutBadge: 'Without VybeKiit',
    rows: [
      { id: 'payments', label: 'Payments', value: 'Manual' },
      { id: 'auth', label: 'Auth', value: 'Manual' },
      { id: 'database', label: 'Database', value: 'Manual' },
      { id: 'deploy', label: 'Deploy', value: 'Manual' },
      { id: 'you', label: 'You', value: 'Overwhelmed' },
    ],
  },
  solution: {
    solutionLabel: 'THE SOLUTION',
    solutionHeading: 'Take payments in your first session.',
    solutionBody:
      'The agent connects payments, handles webhooks, and gives you a working checkout instantly.',
    toastLabel: 'Payment received',
    revenueLabel: 'Revenue',
    revenueDelta: '+27.4% vs last 7 days',
  },
  platforms: {
    heading: 'One purchase. Web, mobile, and a browser extension.',
    subhead: 'One agent. Zero plumbing.',
    web: 'Web',
    mobile: 'Mobile',
    extension: 'Extension',
  },
  compare: {
    heading: 'Become a software engineer without becoming one.',
    subhead:
      'Other kits hand you code and wish you luck. VybeKiit is the agent that builds, wires, and ships for you.',
    footnote:
      'Need deep multi-tenant B2B on day one (RBAC, admin, jobs)? MakerKit and Supastarter are stronger there. VybeKiit wins when you want the agent to operate the whole product so you never read the code.',
    axes: {
      price: 'Price',
      agentOperates: 'Agent builds it for you',
      plainLanguage: 'Plain language only',
      updatesInstall: 'Updates install (no merge)',
      threePlatforms: 'Web + mobile + extension',
      taxesHandled: 'Taxes handled (MoR)',
    },
    coverage: {
      yes: 'Yes',
      partial: 'Partial',
      no: 'No',
    },
  },
  pricing: {
    cadence: 'Pay once · yours for life',
    savingsBefore: 'Save ',
    savingsAfter:
      '% vs buying web + mobile + extension kits alone · Every purchase raises the price',
    bullets: [
      'AI Operator + Web + Mobile + Extension',
      'All features. No limits.',
      'Lifetime access. Yours forever.',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: '-day money-back guarantee.',
    cta: 'Get VybeKiit',
  },
  faq: {
    heading: 'Which package should you get?',
    items: [
      {
        id: 'which-package',
        question: 'Which package should I get?',
        answer:
          'There is only one package. You get the full kit: AI operator + web + mobile + browser extension in a single one-time purchase. No tiers, no “pro” upsell, no picking web-only vs mobile-only. If you only ship a website first, the mobile and extension pieces stay ready for when you need them.',
      },
      {
        id: 'vibe-coder',
        question: 'I only talk to AI tools. Is this for me?',
        answer:
          'Yes. VybeKiit is built for vibe coders: you describe what you want in plain language, and the agent plans, builds, wires payments, verifies, and puts it live. You do not need to read code, fix merges, or learn DevOps. If you already use Claude Code, Cursor, Codex, Kiro, or a similar tool, you are the target buyer.',
      },
      {
        id: 'best-for-non-technical',
        question: 'What is the best SaaS kit if I am not a developer?',
        answer:
          'VybeKiit is the best fit when you want the agent to operate the whole product for you. Other kits hand you code and assume a developer stays in the loop. If you can already ship from a blank repo yourself, a free open-source starter may be enough. If you want “describe it → first payment,” pick VybeKiit.',
      },
      {
        id: 'only-need-web',
        question: 'I only need a website. Should I still buy the full kit?',
        answer:
          'Yes. The price is for the whole kit, and web is the path you start on. Mobile and the browser extension ship in the same purchase so you never pay again when your idea grows. There is no cheaper web-only SKU because the value is one agent that runs the full product, not a pile of half-kits.',
      },
      {
        id: 'vs-shipfast-lovable',
        question: 'How does this compare to ShipFast, Lovable, or MakerKit?',
        answer:
          'ShipFast and MakerKit are great if you are a developer who wants boilerplate and will wire the rest yourself. Lovable and similar AI builders are great for quick UI demos, not for owning a real stack with payments, updates, and three platforms. VybeKiit is the pick when you want one purchase, plain language, and an agent that actually ships and maintains the product.',
      },
      {
        id: 'price-worth-it',
        question: 'Why is it $29 when other kits cost $199+?',
        answer:
          'Because the product is one kit for vibe coders, not a stack of developer tools sold separately. Buying web + mobile + extension from rival kits can run past $600. VybeKiit bundles all three plus the agent operator for a launch price of $29 one-time, with a 14-day refund if it is not for you.',
      },
      {
        id: 'claude-cursor-kiro',
        question: 'Does it work with Claude Code, Cursor, Codex, and Kiro?',
        answer:
          'Yes. VybeKiit is designed so your AI coding tool is the operator: it decides the next step, runs it, and checks the result before moving on. Bring the agent you already pay for. You are not locked into one vendor’s chat UI.',
      },
      {
        id: 'refund-risk',
        question: 'What if it does not work for me?',
        answer:
          'You get a 14-day money-back window. Request a refund and GitHub access to the private repos is revoked. The goal is zero regret: try the flow, see if the agent can take you to a live checkout, and only keep it if it fits how you build.',
      },
      {
        id: 'taxes-payments',
        question: 'Do I have to handle sales tax and VAT myself?',
        answer:
          'No, if you use the default Lemon Squeezy path. Lemon Squeezy is a Merchant of Record, so it files global VAT and sales tax for you. You can still swap payment providers later; the kit is built so the agent wires checkout either way.',
      },
    ],
  },
  brand: {
    tagline: 'The blueprint for vibe coders. Ship projects like a real software engineer.',
  },
};
