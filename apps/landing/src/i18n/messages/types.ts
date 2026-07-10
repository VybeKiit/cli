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
  readonly platforms: {
    readonly heading: string;
    readonly subhead: string;
    readonly web: string;
    readonly mobile: string;
    readonly extension: string;
  };
  readonly compare: {
    readonly heading: string;
    readonly subhead: string;
    readonly footnote: string;
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
