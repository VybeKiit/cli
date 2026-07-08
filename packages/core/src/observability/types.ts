import type { SeverityLevel } from '@sentry/node';

/** Supported observability backends — one runs at a time via `.env`. */
export type ObservabilityProviderName = 'sentry' | 'local';

/** Headless error/message capture — no UI, no builder-facing names. */
export type ObservabilityProvider = {
  readonly name: ObservabilityProviderName;
  readonly captureException: (error: unknown, context?: Record<string, unknown>) => void;
  readonly captureMessage: (
    message: string,
    level?: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ) => void;
};

/** Sentry initialization options controlled by the observability resolver. */
export type InitSentryOptions = {
  readonly dsn: string;
  readonly environment?: string;
  readonly tracesSampleRate?: number;
};

const SENTRY_LEVEL_BY_LOG_LEVEL = {
  info: 'info',
  warning: 'warning',
  error: 'error',
} satisfies Readonly<Record<'info' | 'warning' | 'error', SeverityLevel>>;

/**
 * Map kit severity to Sentry severity.
 *
 * @param level - Kit log severity.
 * @returns Equivalent Sentry severity level.
 * @example
 * const sentryLevel = toSentryLevel('warning');
 */
export const toSentryLevel = (level: 'info' | 'warning' | 'error'): SeverityLevel =>
  SENTRY_LEVEL_BY_LOG_LEVEL[level];
