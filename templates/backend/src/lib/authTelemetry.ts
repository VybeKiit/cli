import { resolveObservabilityProvider } from '@vybekiit/core/observability';
import { resolveAnalyticsProvider } from '@vybekiit/analytics';

export const observability = resolveObservabilityProvider(process.env);

export type AuthEventName = 'signup_completed' | 'sign_in_completed';
export type AuthMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

export function trackAuthEvent(name: AuthEventName, props: { method: AuthMethod }): void {
  try {
    resolveAnalyticsProvider(process.env).track({ name, properties: props });
  } catch {
    // practice mode
  }
}

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
