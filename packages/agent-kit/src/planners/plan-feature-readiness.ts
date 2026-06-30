import { BACKEND_CLI_COMMANDS } from '../catalogs/backend-capabilities';
import type { TemplateId } from '../catalogs/goal-catalog';

export type FeatureName = 'sign-in' | 'payments' | 'save-data' | 'deploy' | 'email' | 'file-upload';

export type OrchestrationAction = 'scaffold-backend' | 'run-skill' | 'set-env' | 'verify';

export interface OrchestrationStep {
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
}

export interface FeatureReadinessPlan {
  readonly template: TemplateId;
  readonly feature: FeatureName;
  readonly ready: boolean;
  readonly orchestrate?: readonly OrchestrationStep[];
}

export interface FeatureReadinessContext {
  readonly template: TemplateId;
  readonly feature: FeatureName;
  /** True when a `backend/` directory exists in the buyer project. */
  readonly hasBackend: boolean;
  /** True when a Next.js web app exists (package.json has next). */
  readonly hasWeb: boolean;
}

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

function needsBackend(template: TemplateId, feature: FeatureName): boolean {
  if (template === 'backend') return false;
  if (template === 'web') return false;
  return BACKEND_FEATURES.includes(feature);
}

function backendOrchestration(
  template: TemplateId,
  feature: FeatureName,
): readonly OrchestrationStep[] {
  const envKey = MOBILE_EXT_ENV_KEYS[template];
  const skillMap: Partial<Record<FeatureName, string>> = {
    'sign-in': 'connect-account',
    payments: 'setup-payments',
    'save-data': 'save-data',
    email: 'wire-email',
    'file-upload': 'add-upload',
  };
  const skill = skillMap[feature] ?? 'onboarding';

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
      envValue: '${BACKEND_URL}',
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
}

/**
 * Detect whether a feature is ready or return orchestration steps to auto-scaffold.
 * Never blocks — always returns steps the agent can execute.
 */
export function planFeatureReadiness(ctx: FeatureReadinessContext): FeatureReadinessPlan {
  const { template, feature, hasBackend, hasWeb } = ctx;

  if (template === 'web') {
    return { template, feature, ready: true };
  }

  if (template === 'backend') {
    return { template, feature, ready: true };
  }

  if (needsBackend(template, feature) && !hasBackend && !hasWeb) {
    return {
      template,
      feature,
      ready: false,
      orchestrate: backendOrchestration(template, feature),
    };
  }

  if (needsBackend(template, feature) && !hasBackend && hasWeb) {
    const envKey = MOBILE_EXT_ENV_KEYS[template];
    return {
      template,
      feature,
      ready: false,
      orchestrate: [
        {
          action: 'set-env',
          envKey,
          envValue: '${WEB_APP_URL}',
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
}
