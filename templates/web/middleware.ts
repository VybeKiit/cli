import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { evaluateApiSecurity } from '@/lib/apiSecurity';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Edge middleware for API security and locale routing.
 *
 * @param request - Incoming Next.js edge request.
 * @returns A blocked API response or the locale middleware response.
 * @example
 * const response = middleware(request);
 */
export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const blocked = evaluateApiSecurity(request);
    if (blocked !== null) {
      return blocked;
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
};

/** Routes covered by the Next.js middleware. */
export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
