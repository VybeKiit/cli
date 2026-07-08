import { resolveAuthProvider } from '@vybekiit/auth';
import { Effect, Exit } from 'effect';
import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE } from './session.js';

type AuthenticatedRequest = Request & {
  readonly user?: { readonly id: string; readonly email: string | null };
};

/**
 * Extract a bearer token from an Authorization header.
 *
 * @param header - Optional Authorization header value.
 * @returns Bearer token, or undefined when the header is absent or not Bearer.
 * @example
 * const token = bearerToken(req.headers.authorization);
 */
const bearerToken = (header: string | undefined): string | undefined => {
  if (header === undefined || !header.startsWith('Bearer ')) {
    return;
  }

  return header.replace('Bearer ', '');
};

/**
 * Resolve the session token from cookie first, then Authorization header.
 *
 * @param req - Express request carrying cookies and headers.
 * @returns Session token, or undefined when no token is present.
 * @example
 * const token = requestToken(req);
 */
const requestToken = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  return bearerToken(req.headers.authorization);
};

/**
 * Require an authenticated user before an Express route runs.
 *
 * @param req - Express request carrying a session cookie or Bearer token.
 * @param res - Express response used for unauthorized failures.
 * @param next - Express continuation called when the user is authenticated.
 * @returns Promise that settles after auth validation completes.
 * @example
 * app.get('/account', requireAuth, accountHandler);
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = requestToken(req);

  if (token === undefined || token.length === 0) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  const exit = await Effect.runPromiseExit(
    resolveAuthProvider().pipe(Effect.flatMap((auth) => auth.getUser(token))),
  );
  if (Exit.isFailure(exit)) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }

  Object.assign(req as AuthenticatedRequest, { user: exit.value });
  next();
};
