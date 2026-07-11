/**
 * Shape of visitor-facing landing copy for one locale.
 * Keep keys stable; only values change per language.
 */

export interface LandingMessages {
  readonly meta: {
    readonly languageName: string;
    readonly switchLanguage: string;
    readonly closeLanguageMenu: string;
  };
  readonly nav: {
    readonly features: string;
    readonly howItWorks: string;
    readonly compare: string;
    readonly pricing: string;
    readonly faq: string;
    readonly getVybekiit: string;
    readonly openMenu: string;
    readonly closeMenu: string;
  };
  readonly footer: {
    readonly rights: string;
    readonly legal: string;
    readonly contact: string;
    readonly compare: string;
    readonly brand: string;
    readonly terms: string;
    readonly privacy: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly headlineBefore: string;
    readonly headlineHighlight: string;
    readonly headlineAfter: string;
    readonly subheadBeforePrice: string;
    readonly subheadAfterPrice: string;
    readonly primaryCta: string;
    readonly trustMoR: string;
    readonly trustRefund: string;
    readonly trustPlatforms: string;
    readonly trustAria: string;
  };
  /**
   * Compact product-definition strip under the nav (locale-aware; not a wall of SEO prose).
   */
  readonly geoLead: {
    readonly ariaLabel: string;
    readonly brandStrong: string;
    readonly beforePrice: string;
    readonly afterPrice: string;
    readonly compareLink: string;
    readonly midLinks: string;
    readonly foundersLink: string;
    readonly andWord: string;
    readonly vibeLink: string;
    readonly end: string;
  };
  readonly builtWith: {
    readonly note: string;
  };
  readonly techTrust: {
    readonly agentsHeading: string;
    readonly stackHeading: string;
  };
  readonly operator: {
    readonly heading: string;
    readonly steps: readonly {
      readonly id: string;
      readonly title: string;
      readonly body: string;
    }[];
  };
  /**
   * “Launch is the hard part” story — education first, soft product CTA.
   * Honest infra framing; no “money in session one” claims.
   */
  readonly vibeStory: {
    readonly label: string;
    readonly heading: string;
    readonly lead: string;
    readonly stages: readonly {
      readonly id: string;
      readonly title: string;
      readonly body: string;
    }[];
    readonly bottomLine: string;
    readonly softCta: string;
    readonly cta: string;
  };
  readonly problem: {
    readonly problemLabel: string;
    readonly problemHeading: string;
    readonly problemBody: string;
    readonly overviewTitle: string;
    readonly withoutBadge: string;
    readonly rows: readonly {
      readonly id: string;
      readonly label: string;
      readonly value: string;
    }[];
  };
  readonly solution: {
    readonly solutionLabel: string;
    readonly solutionHeading: string;
    readonly solutionBody: string;
    readonly toastLabel: string;
    readonly revenueLabel: string;
    readonly revenueDelta: string;
  };
  /**
   * Zig-zag product mocks after payments: auth, settings, and without/with race.
   */
  readonly zigZag: {
    readonly auth: {
      readonly label: string;
      readonly heading: string;
      readonly body: string;
      readonly welcomeBack: string;
      readonly signInSubtitle: string;
      readonly googleCta: string;
      readonly orEmail: string;
      readonly emailPlaceholder: string;
      readonly magicLink: string;
      readonly signingIn: string;
      readonly successTitle: string;
      readonly successBody: string;
      readonly signedInAs: string;
    };
    readonly settings: {
      readonly label: string;
      readonly heading: string;
      readonly body: string;
      readonly navProfile: string;
      readonly navSecurity: string;
      readonly navBilling: string;
      readonly navTeam: string;
      readonly userName: string;
      readonly userEmail: string;
      readonly nameLabel: string;
      readonly roleLabel: string;
      readonly roleValue: string;
      readonly darkMode: string;
      readonly darkModeHint: string;
      readonly saveCta: string;
      readonly saved: string;
      readonly readyBadge: string;
    };
    readonly race: {
      readonly label: string;
      readonly heading: string;
      readonly body: string;
      readonly withoutTitle: string;
      readonly withTitle: string;
      readonly building: string;
      readonly stuck: string;
      readonly finished: string;
      readonly steps: readonly string[];
    };
  };
  readonly platforms: {
    readonly heading: string;
    readonly subhead: string;
    readonly web: string;
    readonly mobile: string;
    readonly extension: string;
    /** Mini mock labels inside platform preview cards. */
    readonly mockOverview: string;
    readonly mockTransactions: string;
    readonly mockCustomers: string;
    readonly mockActive: string;
    readonly mockRefunds: string;
    readonly mockRevenueDelta: string;
  };
  /**
   * Page-recipes marquee section.
   * Templates may include `{readyCount}` or `{count}` placeholders.
   */
  readonly pageRecipes: {
    readonly headline: string;
    readonly badge: string;
    readonly body: string;
    readonly catalogLabel: string;
    readonly catalogAria: string;
    readonly readyBadge: string;
  };
  readonly checkout: {
    readonly titlePrefix: string;
    readonly description: string;
    readonly bulletFull: string;
    readonly bulletOnce: string;
    readonly bulletRefund: string;
    readonly githubLabel: string;
    readonly githubPlaceholder: string;
    readonly githubError: string;
    readonly emailLabel: string;
    readonly emailPlaceholder: string;
    readonly emailError: string;
    readonly submit: string;
    readonly secureNote: string;
    readonly refundNote: string;
  };
  readonly compare: {
    readonly heading: string;
    readonly subhead: string;
    readonly footnote: string;
    /** First column header (not “kit” — vibe coders don’t know that word). */
    readonly optionColumn: string;
    /** Badge on the VybeKiit row. */
    readonly youBadge: string;
    readonly axes: {
      readonly price: string;
      readonly agentOperates: string;
      readonly plainLanguage: string;
      readonly updatesInstall: string;
      readonly threePlatforms: string;
      readonly taxesHandled: string;
    };
    readonly coverage: {
      readonly yes: string;
      readonly partial: string;
      readonly no: string;
    };
  };
  readonly pricing: {
    readonly cadence: string;
    readonly savingsBefore: string;
    readonly savingsAfter: string;
    readonly bullets: readonly string[];
    readonly refundBulletPrefix: string;
    readonly refundBulletSuffix: string;
    readonly cta: string;
  };
  readonly faq: {
    readonly heading: string;
    readonly items: readonly {
      readonly id: string;
      readonly question: string;
      readonly answer: string;
    }[];
  };
  readonly brand: {
    readonly tagline: string;
  };
}
