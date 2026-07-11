import { resolveAuthenticatedUser } from '@vybekiit/auth/http';
import { Either, Schema } from 'effect';
import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE } from './session.js';

type AuthenticatedRequest = Request & {
  readonly user?: { readonly id: string; readonly email: string | null };
};

/** Non-empty session/bearer token accepted by protected routes. */
const SessionTokenSchema = Schema.String.pipe(Schema.minLength(1));
const decodeSessionToken = Schema.decodeUnknownEither(SessionTokenSchema);

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

  const token = header.slice('Bearer '.length);
  const parsed = decodeSessionToken(token);
  if (Either.isLeft(parsed)) {
    return;
  }
  return parsed.right;
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
  const fromCookie = decodeSessionToken(cookieToken);
  if (Either.isRight(fromCookie)) {
    return fromCookie.right;
  }

  return bearerToken(req.headers.authorization);
};

/**
 * Require an authenticated user before an Express route runs.
 *
 * OWNED glue only: token extraction stays here; Exit / user resolution lives in
 * maintained {@link resolveAuthenticatedUser}.
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
  const result = await resolveAuthenticatedUser({
    readToken: () => token ?? null,
  });

  if (!result.ok) {
    res.status(401).json(result.body);
    return;
  }

  Object.assign(req as AuthenticatedRequest, { user: result.user });
  next();
};
