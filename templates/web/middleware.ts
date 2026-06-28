import { type SecurityRequest, SecurityGuard } from '@vybekiit/security';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge security gate for the API — the protection a non-coder never thinks to ask
 * for, on by default. Every `/api/*` request passes a same-origin check (on
 * state-changing methods) and a per-client rate limit before it reaches a route.
 * The rules come from `@vybekiit/security`, which reads the `SECURITY_*` toggles in
 * `.env` (the single source of truth), so tuning protection is an env edit, not a
 * code change — and flipping a toggle off here, in the app, and at the Cloudflare
 * edge all stay consistent because they read the same values.
 *
 * The guard is created once at module load so its in-memory rate-limit counters
 * persist across requests on this instance; constructing it per request would reset
 * everyone's count every time and provide no protection. Per-instance counting is
 * intentionally complemented by the Cloudflare edge layer (`infra/`), which caps
 * abuse distributed across instances.
 */
const guard = new SecurityGuard();

/** Best-effort client IP for rate-limit bucketing, from the standard proxy headers. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Apply the security verdict to every API request; allow non-API routes straight through. */
export function middleware(request: NextRequest): NextResponse {
  const securityRequest: SecurityRequest = {
    method: request.method,
    originHeader: request.headers.get('origin'),
    appOrigin: request.nextUrl.origin,
    clientId: clientIp(request),
    path: request.nextUrl.pathname,
  };

  const verdict = guard.evaluate(securityRequest);
  if (verdict.allowed) return NextResponse.next();

  const status = verdict.reason === 'rate-limit' ? 429 : 403;
  const response = NextResponse.json({ error: verdict.message }, { status });
  if (verdict.retryAfterSeconds !== undefined) {
    response.headers.set('Retry-After', String(verdict.retryAfterSeconds));
  }
  return response;
}

/**
 * Scope the middleware to API routes only. Pages, static assets, and Next internals
 * are untouched, so the origin lock (which blocks cross-site POSTs) never interferes
 * with normal navigation or asset loading.
 */
export const config = {
  matcher: '/api/:path*',
};
