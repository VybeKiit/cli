import {
  analyticsConfigSchema,
  parseEnv,
  plausibleConfigSchema,
  posthogConfigSchema,
} from '@vybekiit/core';
import { createLocalAnalytics } from './providers/local';
import { createPlausibleAnalytics } from './providers/plausible';
import { createPosthogAnalytics } from './providers/posthog';
import type { AnalyticsProvider } from './types';

type EnvSource = Record<string, string | undefined>;

function isPlausibleUnconfigured(env: EnvSource): boolean {
  return !env.PLAUSIBLE_DOMAIN;
}

export function resolveAnalyticsProvider(env: EnvSource = process.env): AnalyticsProvider {
  const { ANALYTICS_PROVIDER } = parseEnv(analyticsConfigSchema, env);
  switch (ANALYTICS_PROVIDER) {
    case 'posthog':
      return createPosthogAnalytics(parseEnv(posthogConfigSchema, env));
    case 'local':
      return createLocalAnalytics();
    default:
      if (isPlausibleUnconfigured(env)) return createLocalAnalytics();
      return createPlausibleAnalytics(parseEnv(plausibleConfigSchema, env));
  }
}
