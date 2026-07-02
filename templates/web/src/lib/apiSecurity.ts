import { forbidden, tooManyRequests } from '@vybekiit/core/http';
import { SecurityGuard, resolveSecurityPolicy } from '@vybekiit/core/security';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const guard = new SecurityGuard(resolveSecurityPolicy());

function clientIdFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Run {@link SecurityGuard} for `/api/*` requests; returns a block response or `null`. */
export function evaluateApiSecurity(request: NextRequest): NextResponse | null {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return null;
  }

  const verdict = guard.evaluate({
    method: request.method,
    originHeader: request.headers.get('origin'),
    appOrigin: request.nextUrl.origin,
    clientId: clientIdFromRequest(request),
    path: request.nextUrl.pathname,
  });

  if (verdict.allowed) {
    return null;
  }

  const headers = new Headers();
  if (verdict.retryAfterSeconds !== undefined) {
    headers.set('Retry-After', String(verdict.retryAfterSeconds));
  }
  const response =
    verdict.reason === 'origin' ? forbidden(verdict.message) : tooManyRequests(verdict.message);
  return NextResponse.json(response.body, { status: response.status, headers });
}
