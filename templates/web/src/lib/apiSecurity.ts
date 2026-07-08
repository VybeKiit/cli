import { forbidden, tooManyRequests } from '@vybekiit/core/http';
import { SecurityGuard, resolveSecurityPolicy } from '@vybekiit/core/security';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const guard = new SecurityGuard(resolveSecurityPolicy());

const UNKNOWN_CLIENT_ID = 'unknown';

const clientIdFromRequest = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const [firstForwarded] = forwarded.split(',');
    if (firstForwarded !== undefined && firstForwarded.trim() !== '') {
      return firstForwarded.trim();
    }
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp === null || realIp === '' ? UNKNOWN_CLIENT_ID : realIp;
};

/**
 * Run {@link SecurityGuard} for `/api/*` requests.
 *
 * @param request - Incoming Next.js request.
 * @returns A blocking response, or `null` when the request may continue.
 * @example
 * const blocked = evaluateApiSecurity(request);
 */
const evaluateApiSecurity = (request: NextRequest): NextResponse | null => {
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
};

export { evaluateApiSecurity };
