import type { SecurityPolicy } from './types';

/**
 * Decide whether a request's `Origin` is allowed under the same-origin lock.
 *
 * Returns `true` (allow) when:
 * - the lock is off, or
 * - there's no `Origin` header — browsers omit it on top-level navigations and
 *   same-origin GETs, so requiring it would break normal page loads, and a missing
 *   header can't be a *cross*-origin attack vector for the form-POST cases we guard, or
 * - the origin equals the app's own origin, or is in the explicit allow-list.
 *
 * Comparison is case-insensitive on the origin only (scheme + host + port); we never
 * compare paths here.
 */
export function isOriginAllowed(
  originHeader: string | null,
  appOrigin: string,
  policy: SecurityPolicy['originLock'],
): boolean {
  if (!policy.enabled) return true;
  if (originHeader === null) return true;

  const origin = originHeader.trim().toLowerCase();
  if (origin === appOrigin.trim().toLowerCase()) return true;
  return policy.allowedOrigins.includes(origin);
}
