import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { evaluateApiSecurity } from '@/lib/apiSecurity';

/** Keep in sync with `src/i18n/routing.ts`. */
const locales = ['en'] as const;
const defaultLocale = 'en';

/**
 * Edge middleware — API security for `/api/*`, locale prefix for everything else.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const blocked = evaluateApiSecurity(request);
    return blocked ?? NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
