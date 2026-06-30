import type { Response } from 'express';

export const SESSION_COOKIE = 'vybekiit_session';

const isProd = process.env.NODE_ENV === 'production';

export function setSessionCookie(res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}
