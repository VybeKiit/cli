import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
} from '@sentry/nextjs';

/**
 * Manual error / message capture for the store.
 * Auto-instrumentation is handled by `@sentry/nextjs` (client, server, edge).
 * Safe no-op when no DSN is configured.
 *
 * @example
 * observability.captureException(error);
 */
export const observability = {
  /**
   * Report an exception to Sentry.
   *
   * @param error - Thrown value or Error instance.
   * @param context - Optional extra key/value context attached to the event.
   * @returns Nothing.
   * @example
   * observability.captureException(error, { route: '/checkout' });
   */
  captureException: (error: unknown, context?: Record<string, unknown>): void => {
    sentryCaptureException(error, context === undefined ? undefined : { extra: context });
  },

  /**
   * Report a free-form message to Sentry.
   *
   * @param message - Human-readable message.
   * @param level - Severity (`info` | `warning` | `error`).
   * @param context - Optional extra key/value context attached to the event.
   * @returns Nothing.
   * @example
   * observability.captureMessage('Checkout abandoned', 'warning', { step: 'email' });
   */
  captureMessage: (
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>,
  ): void => {
    if (context === undefined) {
      sentryCaptureMessage(message, { level });
      return;
    }
    sentryCaptureMessage(message, { level, extra: context });
  },
} as const;
