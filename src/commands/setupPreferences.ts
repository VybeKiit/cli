import { cancel, confirm, isCancel, select } from '@clack/prompts';

export const SETUP_HOSTING_PROVIDERS = [
  'cloudflare',
  'vercel',
  'railway',
  'aws',
  'github-pages',
] as const;
export const SETUP_DATA_PROVIDERS = [
  'supabase',
  'neon',
  'railway',
  'mongodb',
  'firebase',
  'aws',
  'local',
] as const;

export type SetupHostingProvider = (typeof SETUP_HOSTING_PROVIDERS)[number];
export type SetupDataProvider = (typeof SETUP_DATA_PROVIDERS)[number];

export type SetupPreferences = {
  readonly hosting: SetupHostingProvider;
  readonly data: SetupDataProvider;
  readonly googleSignIn: boolean;
};

const DEFAULT_SETUP_PREFERENCES: SetupPreferences = {
  hosting: 'cloudflare',
  data: 'supabase',
  googleSignIn: false,
};

const inlineValue = (args: readonly string[], flag: string): string | undefined =>
  args.find((arg) => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);

const isHostingProvider = (value: string): value is SetupHostingProvider =>
  SETUP_HOSTING_PROVIDERS.some((provider) => provider === value);

const isDataProvider = (value: string): value is SetupDataProvider =>
  SETUP_DATA_PROVIDERS.some((provider) => provider === value);

/** Parse repeatable setup choices from command flags. */
export const parseSetupPreferences = (args: readonly string[]): SetupPreferences => {
  const hostingValue = inlineValue(args, '--hosting') ?? DEFAULT_SETUP_PREFERENCES.hosting;
  const dataValue = inlineValue(args, '--data') ?? DEFAULT_SETUP_PREFERENCES.data;
  if (!isHostingProvider(hostingValue)) {
    throw new Error(`Unsupported app home: ${hostingValue}`);
  }
  if (!isDataProvider(dataValue)) {
    throw new Error(`Unsupported app memory: ${dataValue}`);
  }

  return {
    hosting: hostingValue,
    data: dataValue,
    googleSignIn: args.includes('--google-sign-in'),
  };
};

/** Non-secret settings written into the generated web app. */
export const setupEnvironment = (
  preferences: SetupPreferences,
): Record<'HOSTING_PROVIDER' | 'DATA_PROVIDER', string> => ({
  HOSTING_PROVIDER: preferences.hosting,
  DATA_PROVIDER: preferences.data,
});

/** Plain-language promise printed before setup changes the computer. */
export const formatSetupIntroduction = (): readonly string[] => [
  '',
  'Here is what will happen:',
  '  1. You choose where your app lives online and where it remembers things.',
  '  2. VybeKiit will reuse tools and sign-ins already on this computer.',
  '  3. If a chosen service needs sign-in, VybeKiit will open your browser for it.',
  '  4. Your first SaaS app and assistant tools will be prepared and checked.',
  '  5. A welcome page will open only after the preview is ready.',
  '',
  'No paid services or live resources are created during this setup.',
  '',
];

/** Ask for the one active provider for each concern. */
export const promptSetupPreferences = async (): Promise<SetupPreferences | null> => {
  const hosting = await select({
    message: 'Where should your app live when you put it online?',
    initialValue: DEFAULT_SETUP_PREFERENCES.hosting,
    options: [
      { value: 'cloudflare', label: 'Cloudflare', hint: 'recommended default' },
      { value: 'vercel', label: 'Vercel' },
      { value: 'railway', label: 'Railway' },
      { value: 'aws', label: 'AWS' },
      { value: 'github-pages', label: 'GitHub Pages', hint: 'static sites only' },
    ],
  });
  if (isCancel(hosting) || typeof hosting !== 'string' || !isHostingProvider(hosting)) {
    cancel('Setup cancelled. Nothing else was changed.');
    return null;
  }

  const data = await select({
    message: 'Where should your app remember customer information?',
    initialValue: DEFAULT_SETUP_PREFERENCES.data,
    options: [
      { value: 'supabase', label: 'Supabase', hint: 'recommended default' },
      { value: 'neon', label: 'Neon' },
      { value: 'railway', label: 'Railway' },
      { value: 'mongodb', label: 'MongoDB Atlas' },
      { value: 'firebase', label: 'Firebase' },
      { value: 'aws', label: 'AWS' },
      { value: 'local', label: 'Practice data only', hint: 'no service sign-in' },
    ],
  });
  if (isCancel(data) || typeof data !== 'string' || !isDataProvider(data)) {
    cancel('Setup cancelled. Nothing else was changed.');
    return null;
  }

  const googleSignIn = await confirm({
    message: 'Prepare one-tap Google sign-in for your customers?',
    initialValue: false,
  });
  if (isCancel(googleSignIn)) {
    cancel('Setup cancelled. Nothing else was changed.');
    return null;
  }

  return { hosting, data, googleSignIn };
};

/** Render normalized flags for the lower-level install flow. */
export const setupPreferenceFlags = (preferences: SetupPreferences): readonly string[] => [
  `--hosting=${preferences.hosting}`,
  `--data=${preferences.data}`,
  ...(preferences.googleSignIn ? ['--google-sign-in'] : []),
];
