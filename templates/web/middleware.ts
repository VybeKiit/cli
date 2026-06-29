import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Keep in sync with `src/i18n/routing.ts`. */
const locales = ['en'] as const;
const defaultLocale = 'en';

/**
 * Locale prefix middleware — redirects bare paths to `/{locale}/…`.
 * Custom edge middleware avoids bundling issues with `next-intl/middleware` in this kit.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
