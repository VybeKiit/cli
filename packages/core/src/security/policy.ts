import { parseEnv, type SecurityConfig, securityConfigSchema } from '@vybekiit/core/config';
import type { SecurityPolicy } from './types';

/** Methods that carry no state change and need no origin check (they're safe + idempotent). */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** True when the request method mutates state, so the origin lock should apply to it. */
export function isStateChanging(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}

/**
 * Split the `SECURITY_ALLOWED_ORIGINS` CSV into a clean, lowercased list.
 *
 * Trims blanks and drops empties so a trailing comma or an all-blank value yields `[]`
 * (same-origin only — the safe default) rather than an origin that matches everything.
 */
export function parseAllowedOrigins(csv: string): string[] {
  return csv
    .split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter((origin) => origin.length > 0);
}

/**
 * Turn the validated env config into a normalized {@link SecurityPolicy}.
 *
 * Reads the core SSOT so the app middleware and the edge generator resolve identical
 * rules from the same `.env`. Accepts an optional pre-parsed config for callers that
 * already hold one (avoids double-parsing in a request hot path).
 */
export function resolveSecurityPolicy(
  config: SecurityConfig = parseEnv(securityConfigSchema),
): SecurityPolicy {
  const defaultMax = config.SECURITY_RATE_LIMIT_MAX;
  return {
    rateLimit: {
      enabled: config.SECURITY_RATE_LIMIT === 'on',
      windowSeconds: config.SECURITY_RATE_LIMIT_WINDOW_SECONDS,
      defaultMax,
      tierMax: {
        'auth-strict': config.SECURITY_RATE_LIMIT_AUTH_MAX,
        'public-form': config.SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX,
        webhook: defaultMax,
        authenticated: defaultMax,
        'public-read': defaultMax * 2,
        default: defaultMax,
      },
    },
    originLock: {
      enabled: config.SECURITY_ORIGIN_LOCK === 'on',
      allowedOrigins: parseAllowedOrigins(config.SECURITY_ALLOWED_ORIGINS),
    },
  };
}

/** Resolve the per-tier request ceiling for a classified route. */
export function rateLimitMaxForTier(
  policy: SecurityPolicy,
  tier: import('./routes').RouteTier,
): number {
  return policy.rateLimit.tierMax[tier] ?? policy.rateLimit.defaultMax;
}
