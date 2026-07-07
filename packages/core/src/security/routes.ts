/**
 * Route classification for tiered rate limits and origin-lock exceptions.
 *
 * Each `/api/*` path maps to a tier so login hammering and a contact form never share
 * the same bucket, and webhooks skip origin lock (external callers, signature-verified).
 */

export type RouteTier =
  | 'auth-strict'
  | 'public-form'
  | 'webhook'
  | 'authenticated'
  | 'public-read'
  | 'default';

/**
 * Normalize a path to lowercase without a query string or trailing slash.
 *
 * @param path - Raw request path.
 * @returns Comparable route path.
 * @example
 * const path = normalizePath('/API/Auth/Signin?x=1');
 */
const normalizePath = (path: string): string => {
  const [head] = path.split('?');
  const base = head === undefined ? '/' : head.toLowerCase();
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
};

/**
 * Classify an API path into a security tier.
 *
 * Order matters: more specific prefixes win. Webhook is checked before auth because
 * `/api/webhook` must not inherit auth-strict limits or origin lock.
 *
 * @param path - API path to classify.
 * @returns The security tier for the path.
 * @example
 * const tier = classifyRoute('/api/auth/signin');
 */
export const classifyRoute = (path: string): RouteTier => {
  const p = normalizePath(path);

  if (p === '/api/webhook' || p.startsWith('/api/webhook/')) {
    return 'webhook';
  }

  if (
    p.startsWith('/api/auth/signin') ||
    p.startsWith('/api/auth/signup') ||
    p.startsWith('/api/auth/send-code') ||
    p.startsWith('/api/auth/verify') ||
    p === '/api/auth/signin' ||
    p === '/api/auth/signup' ||
    p === '/api/auth/send-code' ||
    p === '/api/auth/verify'
  ) {
    return 'auth-strict';
  }

  if (
    p.startsWith('/api/contact') ||
    p.startsWith('/api/waitlist') ||
    p.startsWith('/api/newsletter')
  ) {
    return 'public-form';
  }

  if (p.startsWith('/api/me') || p.startsWith('/api/user')) {
    return 'authenticated';
  }

  if (p.startsWith('/api/health') || p.startsWith('/api/public')) {
    return 'public-read';
  }

  return 'default';
};

/**
 * Check whether a route tier bypasses origin lock.
 *
 * @param tier - Classified route tier.
 * @returns Whether the route is trusted by signature instead of browser origin.
 * @example
 * isOriginLockExempt('webhook') === true;
 */
export const isOriginLockExempt = (tier: RouteTier): boolean => tier === 'webhook';
