import type { SeverityLevel } from '@sentry/node';

/** Supported observability backends — one runs at a time via `.env`. */
export type ObservabilityProviderName = 'sentry' | 'local';

/** Headless error/message capture — no UI, no builder-facing names. */
export interface ObservabilityProvider {
  readonly name: ObservabilityProviderName;
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(
    message: string,
    level?: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void;
}

export interface InitSentryOptions {
  readonly dsn: string;
  readonly environment?: string;
  readonly tracesSampleRate?: number;
}

/** Map kit severity to Sentry severity. */
export function toSentryLevel(level: 'info' | 'warning' | 'error'): SeverityLevel {
  switch (level) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    default:
      return 'error';
  }
}
