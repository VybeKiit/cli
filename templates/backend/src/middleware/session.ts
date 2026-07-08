import type { Response } from 'express';

/** Matches web template session cookie (`templates/web/src/lib/auth-session.ts`). */
export const SESSION_COOKIE = 'vk_session';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Write the signed auth session cookie.
 *
 * @param res - Express response that receives the cookie.
 * @param sessionToken - Session token issued by the auth provider.
 * @returns Void after setting the cookie header.
 * @example
 * setSessionCookie(res, sessionToken);
 */
export const setSessionCookie = (res: Response, sessionToken: string): void => {
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

/**
 * Clear the auth session cookie.
 *
 * @param res - Express response that clears the cookie.
 * @returns Void after clearing the cookie header.
 * @example
 * clearSessionCookie(res);
 */
export const clearSessionCookie = (res: Response): void => {
  res.clearCookie(SESSION_COOKIE);
};
