import {
  analyticsConfigSchema,
  type EnvSource,
  parseEnv,
  plausibleConfigSchema,
  posthogConfigSchema,
  resolveEnvProvider,
} from '@vybekiit/core';
import { createLocalAnalytics } from './providers/local';
import { createPlausibleAnalytics } from './providers/plausible';
import { createPosthogAnalytics } from './providers/posthog';
import type { AnalyticsProvider } from './types';

function isPlausibleUnconfigured(env: EnvSource): boolean {
  return !env.PLAUSIBLE_DOMAIN;
}

export function resolveAnalyticsProvider(env: EnvSource = process.env): AnalyticsProvider {
  const { ANALYTICS_PROVIDER } = parseEnv(analyticsConfigSchema, env);
  return resolveEnvProvider(
    ANALYTICS_PROVIDER,
    {
      posthog: (source) => createPosthogAnalytics(parseEnv(posthogConfigSchema, source)),
      local: () => createLocalAnalytics(),
      plausible: (source) =>
        isPlausibleUnconfigured(source)
          ? createLocalAnalytics()
          : createPlausibleAnalytics(parseEnv(plausibleConfigSchema, source)),
    },
    env,
    'plausible',
  );
}
