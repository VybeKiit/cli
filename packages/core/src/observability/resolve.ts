import { observabilityConfigSchema, parseEnv, sentryConfigSchema } from '@vybekiit/core/config';

import { createLocalObservabilityProvider } from './providers/local';
import { createSentryObservabilityProvider, initSentry } from './providers/sentry';
import type { ObservabilityProvider } from './types';

type EnvSource = Record<string, string | undefined>;

/**
 * Construct the configured observability provider from the environment.
 *
 * @param env - Raw environment source to decode.
 * @returns The configured observability provider.
 * @throws When Sentry is selected without `SENTRY_DSN`.
 * @example
 * const observability = resolveObservabilityProvider(process.env);
 */
export const resolveObservabilityProvider = (
  env: EnvSource = process.env,
): ObservabilityProvider => {
  const { OBSERVABILITY_PROVIDER } = parseEnv(observabilityConfigSchema, env);

  if (OBSERVABILITY_PROVIDER === 'sentry') {
    const { SENTRY_DSN } = parseEnv(sentryConfigSchema, env);
    if (!SENTRY_DSN) {
      throw new Error(
        'Invalid VybeKiit configuration:\n  - SENTRY_DSN: Required when OBSERVABILITY_PROVIDER=sentry',
      );
    }
    const environment = env.NODE_ENV === undefined ? 'development' : env.NODE_ENV;
    initSentry({
      dsn: SENTRY_DSN,
      environment,
    });
    return createSentryObservabilityProvider();
  }

  return createLocalObservabilityProvider();
};
