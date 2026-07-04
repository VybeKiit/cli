import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { evaluateApiSecurity } from '@/lib/apiSecurity';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Edge middleware — API security for `/api/*`, next-intl locale routing for pages.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const blocked = evaluateApiSecurity(request);
    return blocked ?? NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
