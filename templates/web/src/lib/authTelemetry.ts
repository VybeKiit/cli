import { Effect } from 'effect';
import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { observability } from '@/lib/observability';

type AuthEventName = 'signup_completed' | 'sign_in_completed';
type AuthMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

/**
 * Fire a visitor-stats event on auth success.
 *
 * @param name - Auth event name recorded by analytics.
 * @param props - Auth method details attached to the event.
 * @returns Nothing; local/unconfigured analytics is treated as a no-op.
 * @example
 * trackAuthEvent('sign_in_completed', { method: 'password' });
 */
const trackAuthEvent = (name: AuthEventName, props: { method: AuthMethod }): void => {
  Effect.runSync(
    resolveAnalyticsProvider().pipe(
      Effect.flatMap((analytics) => analytics.track({ name, properties: props })),
      Effect.catchAll(() => Effect.void),
    ),
  );
};

/**
 * Report unexpected auth failures to observability.
 *
 * @param error - Unknown failure captured at the auth boundary.
 * @param context - Optional string tags for the auth operation.
 * @returns Nothing; local observability intentionally stays quiet.
 * @example
 * captureAuthFailure(error, { action: 'sign-in' });
 */
const captureAuthFailure = (error: unknown, context?: Record<string, string | undefined>): void => {
  try {
    observability.captureException(error, { domain: 'auth', ...context });
  } catch {
    // local observability
  }
};

/**
 * Report expected auth rejection without throwing.
 *
 * @param message - Plain rejection message such as wrong password or invalid code.
 * @param context - Optional string tags for the auth operation.
 * @returns Nothing; local observability intentionally stays quiet.
 * @example
 * captureAuthRejection('Invalid code', { action: 'verify' });
 */
const captureAuthRejection = (
  message: string,
  context?: Record<string, string | undefined>,
): void => {
  try {
    observability.captureMessage(message, 'warning', { domain: 'auth', ...context });
  } catch {
    // local observability
  }
};

export { captureAuthFailure, captureAuthRejection, trackAuthEvent };
export type { AuthEventName, AuthMethod };
