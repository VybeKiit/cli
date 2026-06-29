/** Feature highlight cards on the home screen — keys into `messages/en.json`. */
export interface HomeFeature {
  readonly titleKey: string;
  readonly bodyKey: string;
}

/** The three feature highlights on the home screen. */
export const HOME_FEATURES: readonly HomeFeature[] = [
  {
    titleKey: 'home.features.payments.title',
    bodyKey: 'home.features.payments.body',
  },
  {
    titleKey: 'home.features.data.title',
    bodyKey: 'home.features.data.body',
  },
  {
    titleKey: 'home.features.deploy.title',
    bodyKey: 'home.features.deploy.body',
  },
];
