import type { AuthHttpDeps } from '@vybekiit/auth/http';
import type { Request, Response } from 'express';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from '@/middleware/session.js';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from './authTelemetry.js';

/**
 * Read the current auth session cookie from an Express request.
 *
 * @param req - Express request carrying cookies.
 * @returns Session token string, or null when absent.
 * @example
 * const sessionToken = readSessionCookie(req);
 */
const readSessionCookie = (req: Request): string | null => {
  const value = req.cookies?.[SESSION_COOKIE];
  if (typeof value === 'string') {
    return value;
  }

  return null;
};

/**
 * Create per-request Express session and telemetry dependencies for auth routes.
 *
 * @param req - Express request carrying cookies.
 * @param res - Express response used to write or clear session cookies.
 * @returns Auth HTTP dependencies consumed by `createExpressAuthRouter`.
 * @example
 * const deps = createBackendAuthHttpDeps(req, res);
 */
export const createBackendAuthHttpDeps = (req: Request, res: Response): AuthHttpDeps => ({
  session: {
    setSession: (token: string) => {
      setSessionCookie(res, token);
    },
    readSession: () => readSessionCookie(req),
    clearSession: () => {
      clearSessionCookie(res);
    },
  },
  telemetry: {
    trackAuthEvent,
    captureAuthRejection,
    captureAuthFailure,
  },
});
