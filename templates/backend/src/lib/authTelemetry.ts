import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { resolveObservabilityProvider } from '@vybekiit/core/observability';
import { Effect } from 'effect';

/** Observability provider used by auth telemetry helpers. */
export const observability = resolveObservabilityProvider(process.env);

export type AuthEventName = 'signup_completed' | 'sign_in_completed';
export type AuthMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

/**
 * Track a completed auth event through the configured analytics provider.
 *
 * @param name - Auth event name to record.
 * @param props - Auth method metadata attached to the event.
 * @returns Void after the analytics Effect has been run.
 * @example
 * trackAuthEvent('sign_in_completed', { method: 'password' });
 */
export const trackAuthEvent = (
  name: AuthEventName,
  props: { readonly method: AuthMethod },
): void => {
  Effect.runSync(
    resolveAnalyticsProvider(process.env).pipe(
      Effect.flatMap((analytics) => analytics.track({ name, properties: props })),
      Effect.catchAll(() => Effect.void),
    ),
  );
};

/**
 * Capture an unexpected auth failure through observability.
 *
 * @param error - Unknown failure value to report.
 * @param context - Optional string context attached to the report.
 * @returns Void after the failure has been reported or ignored locally.
 * @example
 * captureAuthFailure(error, { route: 'sign-in' });
 */
export const captureAuthFailure = (
  error: unknown,
  context?: Record<string, string | undefined>,
): void => {
  try {
    observability.captureException(error, { domain: 'auth', ...context });
  } catch {
    // local observability
  }
};

/**
 * Capture an expected auth rejection through observability.
 *
 * @param message - Rejection message to report.
 * @param context - Optional string context attached to the report.
 * @returns Void after the rejection has been reported or ignored locally.
 * @example
 * captureAuthRejection('Invalid code.', { route: 'verify-code' });
 */
export const captureAuthRejection = (
  message: string,
  context?: Record<string, string | undefined>,
): void => {
  try {
    observability.captureMessage(message, 'warning', { domain: 'auth', ...context });
  } catch {
    // local observability
  }
};
