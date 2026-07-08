import { captureException, captureMessage, init as initSentryClient } from '@sentry/node';

import type { InitSentryOptions, ObservabilityProvider } from '@vybekiit/core/observability/types';
import { toSentryLevel } from '@vybekiit/core/observability/types';

let sentryInitialized = false;

/**
 * Initialize the Sentry client once — call from Next.js `instrumentation.ts` or
 * the mobile app entry before handling traffic.
 *
 * @param options - Sentry initialization options resolved from config.
 * @returns Nothing; initializes the Sentry singleton once.
 * @example
 * initSentry({ dsn: process.env.SENTRY_DSN, environment: 'production' });
 */
export const initSentry = (options: InitSentryOptions): void => {
  if (sentryInitialized) {
    return;
  }
  const environment = options.environment === undefined ? 'development' : options.environment;
  const tracesSampleRate = options.tracesSampleRate === undefined ? 0 : options.tracesSampleRate;
  initSentryClient({
    dsn: options.dsn,
    environment,
    tracesSampleRate,
  });
  sentryInitialized = true;
};

/**
 * Reset Sentry initialization state for tests.
 *
 * @returns Nothing; mutates the module-level test flag.
 * @example
 * resetSentryForTests();
 */
export const resetSentryForTests = (): void => {
  sentryInitialized = false;
};

/**
 * Create the Sentry-backed observability provider.
 *
 * @returns A provider that forwards exceptions and messages to Sentry.
 * @example
 * const provider = createSentryObservabilityProvider();
 */
export const createSentryObservabilityProvider = (): ObservabilityProvider => ({
  name: 'sentry',
  captureException: (error: unknown, context?: Record<string, unknown>): void => {
    captureException(error, context ? { extra: context } : undefined);
  },
  captureMessage: (
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>,
  ): void => {
    if (context === undefined) {
      captureMessage(message, { level: toSentryLevel(level) });
      return;
    }
    captureMessage(message, {
      level: toSentryLevel(level),
      extra: context,
    });
  },
});
