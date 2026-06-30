import type { Response } from 'express';

/** Matches web template session cookie (`templates/web/src/lib/auth-session.ts`). */
export const SESSION_COOKIE = 'vk_session';

const isProd = process.env.NODE_ENV === 'production';

export function setSessionCookie(res: Response, sessionToken: string): void {
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}
