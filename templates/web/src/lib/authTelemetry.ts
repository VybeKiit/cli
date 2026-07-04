import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { observability } from '@/lib/observability';

export type AuthEventName = 'signup_completed' | 'sign_in_completed';
export type AuthMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

/** Fire a visitor-stats event on auth success — no-op when analytics is local/unconfigured. */
export function trackAuthEvent(name: AuthEventName, props: { method: AuthMethod }): void {
  try {
    resolveAnalyticsProvider().track({ name, properties: props });
  } catch {
    // practice mode
  }
}

/** Report auth failures to error alerts when Sentry is configured. */
export function captureAuthFailure(
  error: unknown,
  context?: Record<string, string | undefined>,
): void {
  try {
    observability.captureException(error, { domain: 'auth', ...context });
  } catch {
    // local observability
  }
}

/** Report expected auth rejection (wrong password, invalid code) without throwing. */
export function captureAuthRejection(
  message: string,
  context?: Record<string, string | undefined>,
): void {
  try {
    observability.captureMessage(message, 'warning', { domain: 'auth', ...context });
  } catch {
    // local observability
  }
}
