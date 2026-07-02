import { observabilityConfigSchema, parseEnv, sentryConfigSchema } from '../config';

import { createLocalObservabilityProvider } from './providers/local';
import { createSentryObservabilityProvider, initSentry } from './providers/sentry';
import type { ObservabilityProvider } from './types';

type EnvSource = Record<string, string | undefined>;

/**
 * Construct the configured observability provider from the environment — the
 * single call site the track-errors skill and error boundaries use.
 *
 * - `OBSERVABILITY_PROVIDER=local` (default) → no-op until the builder asks for alerts.
 * - `OBSERVABILITY_PROVIDER=sentry` + `SENTRY_DSN` → Sentry (init runs here once).
 */
export function resolveObservabilityProvider(env: EnvSource = process.env): ObservabilityProvider {
  const { OBSERVABILITY_PROVIDER } = parseEnv(observabilityConfigSchema, env);

  if (OBSERVABILITY_PROVIDER === 'sentry') {
    const { SENTRY_DSN } = parseEnv(sentryConfigSchema, env);
    if (!SENTRY_DSN) {
      throw new Error(
        'Invalid VybeKiit configuration:\n  - SENTRY_DSN: Required when OBSERVABILITY_PROVIDER=sentry',
      );
    }
    initSentry({
      dsn: SENTRY_DSN,
      environment: env.NODE_ENV ?? 'development',
    });
    return createSentryObservabilityProvider();
  }

  return createLocalObservabilityProvider();
}

export { initSentry, resetSentryForTests } from './providers/sentry';
export { createLocalObservabilityProvider } from './providers/local';
export { createSentryObservabilityProvider } from './providers/sentry';
export type {
  InitSentryOptions,
  ObservabilityProvider,
  ObservabilityProviderName,
} from './types';
