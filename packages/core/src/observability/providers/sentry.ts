import * as Sentry from '@sentry/node';

import type { InitSentryOptions, ObservabilityProvider } from '../types';
import { toSentryLevel } from '../types';

let sentryInitialized = false;

/**
 * Initialize the Sentry client once — call from Next.js `instrumentation.ts` or
 * the mobile app entry before handling traffic.
 */
export function initSentry(options: InitSentryOptions): void {
  if (sentryInitialized) return;
  Sentry.init({
    dsn: options.dsn,
    environment: options.environment ?? 'development',
    tracesSampleRate: options.tracesSampleRate ?? 0,
  });
  sentryInitialized = true;
}

/** Reset init state — tests only. */
export function resetSentryForTests(): void {
  sentryInitialized = false;
}

/** Sentry-backed observability — requires {@link initSentry} first. */
export function createSentryObservabilityProvider(): ObservabilityProvider {
  return {
    name: 'sentry',
    captureException(error: unknown, context?: Record<string, unknown>): void {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    },
    captureMessage(
      message: string,
      level: 'info' | 'warning' | 'error' = 'info',
      context?: Record<string, unknown>,
    ): void {
      Sentry.captureMessage(message, {
        level: toSentryLevel(level),
        ...(context ? { extra: context } : {}),
      });
    },
  };
}
