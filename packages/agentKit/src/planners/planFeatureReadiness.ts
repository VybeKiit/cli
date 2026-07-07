import { BACKEND_CLI_COMMANDS } from '@vybekiit/agent-kit/catalogs/backendCapabilities';
import type { TemplateId } from '@vybekiit/agent-kit/catalogs/goalCatalog';

export type FeatureName = 'sign-in' | 'payments' | 'save-data' | 'deploy' | 'email' | 'file-upload';

export type OrchestrationAction = 'scaffold-backend' | 'run-skill' | 'set-env' | 'verify';

export type OrchestrationStep = {
  readonly action: OrchestrationAction;
  readonly cli?: string;
  readonly skill?: string;
  readonly envKey?: string;
  readonly envValue?: string;
  readonly verify?: string;
  /** Plain-language message for the builder. */
  readonly builderMessage: string;
  /** Agent-internal context (skill paths, template names). */
  readonly agentNote?: string;
};

export type FeatureReadinessPlan = {
  readonly template: TemplateId;
  readonly feature: FeatureName;
  readonly ready: boolean;
  readonly orchestrate?: readonly OrchestrationStep[];
};

export type TemplateTopologyCombo =
  | 'full-stack-web'
  | 'standalone-backend'
  | 'client-with-backend'
  | 'client-with-web'
  | 'client-only';

export type TemplateTopologyContext = {
  readonly template: TemplateId;
  readonly hasBackend: boolean;
  readonly hasWeb: boolean;
};

/**
 * Explicit server topology for buyer projects — guides feature readiness orchestration.
 *
 * @param ctx - ctx input.
 * @returns The resolve template topology result.
 * @example
 * const result = resolveTemplateTopology(ctx);
 */
export const resolveTemplateTopology = (ctx: TemplateTopologyContext): TemplateTopologyCombo => {
  const { template, hasBackend, hasWeb } = ctx;
  if (template === 'web') {
    return 'full-stack-web';
  }
  if (template === 'backend') {
    return 'standalone-backend';
  }
  if (hasBackend) {
    return 'client-with-backend';
  }
  if (hasWeb) {
    return 'client-with-web';
  }
  return 'client-only';
};

export type FeatureReadinessContext = {
  readonly template: TemplateId;
  readonly feature: FeatureName;
  /** True when a `backend/` directory exists in the buyer project. */
  readonly hasBackend: boolean;
  /** True when a Next.js web app exists (package.json has next). */
  readonly hasWeb: boolean;
};

const MOBILE_EXT_ENV_KEYS: Readonly<Record<TemplateId, string>> = {
  web: 'APP_URL',
  mobile: 'EXPO_PUBLIC_APP_URL',
  extension: 'WXT_PUBLIC_APP_URL',
  spa: 'VITE_PUBLIC_APP_URL',
  backend: 'APP_URL',
};

const BACKEND_FEATURES: readonly FeatureName[] = [
  'sign-in',
  'payments',
  'save-data',
  'email',
  'file-upload',
];
const BACKEND_URL_PLACEHOLDER = ['$', '{BACKEND_URL}'].join('');
const WEB_APP_URL_PLACEHOLDER = ['$', '{WEB_APP_URL}'].join('');

const needsBackend = (template: TemplateId, feature: FeatureName): boolean => {
  if (template === 'backend') {
    return false;
  }
  if (template === 'web') {
    return false;
  }
  return BACKEND_FEATURES.includes(feature);
};

const backendOrchestration = (
  template: TemplateId,
  feature: FeatureName,
): readonly OrchestrationStep[] => {
  const envKey = MOBILE_EXT_ENV_KEYS[template];
  const skillMap: Readonly<Record<FeatureName, string>> = {
    'sign-in': 'connect-account',
    payments: 'setup-payments',
    'save-data': 'save-data',
    deploy: 'onboarding',
    email: 'wire-email',
    'file-upload': 'add-upload',
  };
  const skill = skillMap[feature];

  return [
    {
      action: 'scaffold-backend',
      cli: BACKEND_CLI_COMMANDS.scaffold,
      builderMessage: 'Setting up the server your app talks to…',
      agentNote: 'Scaffold Express MVC backend/ — mobile/extension API target',
    },
    {
      action: 'run-skill',
      skill,
      builderMessage: 'Wiring that up for you now…',
      agentNote: `.vybekiit/skills/${skill}.md on backend template`,
    },
    {
      action: 'set-env',
      envKey,
      envValue: BACKEND_URL_PLACEHOLDER,
      builderMessage: 'Connecting your app to the server…',
      agentNote: `Set ${envKey} to backend dev URL (default http://localhost:4000)`,
    },
    {
      action: 'verify',
      verify: 'sign-in-flow',
      builderMessage: 'Checking that sign-in works…',
      agentNote: 'Manual or automated verify per skill contract',
    },
  ];
};

/**
 * Detect whether a feature is ready or return orchestration steps to auto-scaffold.
 *
 * @param ctx - ctx input.
 * @returns The plan feature readiness result.
 * @example
 * const result = planFeatureReadiness(ctx);
 */
export const planFeatureReadiness = (ctx: FeatureReadinessContext): FeatureReadinessPlan => {
  const { template, feature } = ctx;
  const topology = resolveTemplateTopology(ctx);

  if (topology === 'full-stack-web' || topology === 'standalone-backend') {
    return { template, feature, ready: true };
  }

  if (needsBackend(template, feature) && topology === 'client-only') {
    return {
      template,
      feature,
      ready: false,
      orchestrate: backendOrchestration(template, feature),
    };
  }

  if (needsBackend(template, feature) && topology === 'client-with-web') {
    const envKey = MOBILE_EXT_ENV_KEYS[template];
    return {
      template,
      feature,
      ready: false,
      orchestrate: [
        {
          action: 'set-env',
          envKey,
          envValue: WEB_APP_URL_PLACEHOLDER,
          builderMessage: 'Connecting your app to your website…',
          agentNote:
            'Buyer has Next.js web — point client at web APP_URL instead of scaffolding backend',
        },
        {
          action: 'run-skill',
          skill: 'connect-account',
          builderMessage: 'Setting up sign-in…',
        },
      ],
    };
  }

  return { template, feature, ready: true };
};
