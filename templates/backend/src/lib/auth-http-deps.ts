import type { AuthHttpDeps } from '@vybekiit/auth/http';
import type { Request, Response } from 'express';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from './auth-telemetry.js';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie } from '../middleware/session.js';

/** Per-request Express session + telemetry deps for {@link createExpressAuthRouter}. */
export function createBackendAuthHttpDeps(req: Request, res: Response): AuthHttpDeps {
  return {
    session: {
      setSession: async (token: string) => {
        setSessionCookie(res, token);
      },
      readSession: async () => req.cookies?.[SESSION_COOKIE] ?? null,
      clearSession: async () => {
        clearSessionCookie(res);
      },
    },
    telemetry: {
      trackAuthEvent,
      captureAuthRejection,
      captureAuthFailure,
    },
  };
}
