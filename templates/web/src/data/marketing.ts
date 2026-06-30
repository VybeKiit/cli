/** Feature highlight cards on the home screen — keys into `messages/en.json`. */
export type HomeFeatureIcon = 'payments' | 'data' | 'deploy' | 'stats' | 'alerts';

export interface HomeFeature {
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly tooltipKey: string;
  readonly hintLabelKey: string;
  readonly techLabelKey?: string;
  readonly icon: HomeFeatureIcon;
  /** Stagger intro tooltips so they do not stack on mount. */
  readonly mountHintDelayMs?: number;
}

/** Marketing feature cards shown below the hero on the home page. */
export const HOME_FEATURES: readonly HomeFeature[] = [
  {
    titleKey: 'home.features.payments.title',
    bodyKey: 'home.features.payments.body',
    tooltipKey: 'home.features.payments.tooltip',
    hintLabelKey: 'home.features.payments.hintLabel',
    icon: 'payments',
    mountHintDelayMs: 600,
  },
  {
    titleKey: 'home.features.data.title',
    bodyKey: 'home.features.data.body',
    tooltipKey: 'home.features.data.tooltip',
    hintLabelKey: 'home.features.data.hintLabel',
    icon: 'data',
    mountHintDelayMs: 1200,
  },
  {
    titleKey: 'home.features.deploy.title',
    bodyKey: 'home.features.deploy.body',
    tooltipKey: 'home.features.deploy.tooltip',
    hintLabelKey: 'home.features.deploy.hintLabel',
    icon: 'deploy',
    mountHintDelayMs: 1800,
  },
  {
    titleKey: 'home.features.stats.title',
    bodyKey: 'home.features.stats.body',
    tooltipKey: 'home.features.stats.tooltip',
    hintLabelKey: 'home.features.stats.hintLabel',
    techLabelKey: 'home.features.stats.techLabel',
    icon: 'stats',
    mountHintDelayMs: 2400,
  },
  {
    titleKey: 'home.features.alerts.title',
    bodyKey: 'home.features.alerts.body',
    tooltipKey: 'home.features.alerts.tooltip',
    hintLabelKey: 'home.features.alerts.hintLabel',
    techLabelKey: 'home.features.alerts.techLabel',
    icon: 'alerts',
    mountHintDelayMs: 3000,
  },
];
