import {
  analyticsConfigSchema,
  parseEnv,
  plausibleConfigSchema,
  posthogConfigSchema,
  resolveEnvProvider,
  type EnvSource,
} from '@vybekiit/core';
import { createLocalAnalytics } from './providers/local.js';
import { createPlausibleAnalytics } from './providers/plausible.js';
import { createPosthogAnalytics } from './providers/posthog.js';
import type { AnalyticsProvider } from './types.js';

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
