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

/** Normalize to a comparable path (lowercase, no trailing slash). */
function normalizePath(path: string): string {
  const base = path.split('?')[0]?.toLowerCase() ?? '/';
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
}

/**
 * Classify an API path into a security tier.
 *
 * Order matters: more specific prefixes win. Webhook is checked before auth because
 * `/api/webhook` must not inherit auth-strict limits or origin lock.
 */
export function classifyRoute(path: string): RouteTier {
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
}

/** True when the origin lock must not apply (external trusted-by-signature callers). */
export function isOriginLockExempt(tier: RouteTier): boolean {
  return tier === 'webhook';
}
