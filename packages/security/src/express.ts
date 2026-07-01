import type { NextFunction, Request, Response } from 'express';
import { forbidden, tooManyRequests } from '@vybekiit/http';
import { sendHttpResponse } from '@vybekiit/http/express';
import { SecurityGuard } from './guard';
import { resolveSecurityPolicy } from './policy';
import type { SecurityRequest } from './types';

function clientIdFromRequest(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return req.ip ?? 'unknown';
}

function toSecurityRequest(req: Request, appOrigin: string): SecurityRequest {
  return {
    method: req.method,
    originHeader: typeof req.headers.origin === 'string' ? req.headers.origin : null,
    appOrigin,
    clientId: clientIdFromRequest(req),
    path: req.path.startsWith('/api') ? req.path : `/api${req.path}`,
  };
}

export interface ExpressSecurityOptions {
  guard?: SecurityGuard;
  /** Canonical app origin for same-origin lock (defaults to APP_URL env). */
  appOrigin?: string;
}

/** Express middleware — tiered rate limits + same-origin lock for state-changing API calls. */
export function createExpressSecurityMiddleware(
  options: ExpressSecurityOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const guard = options.guard ?? new SecurityGuard(resolveSecurityPolicy());
  const appOrigin =
    options.appOrigin ?? process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`;

  return (req, res, next) => {
    const verdict = guard.evaluate(toSecurityRequest(req, appOrigin));
    if (!verdict.allowed) {
      if (verdict.retryAfterSeconds !== undefined) {
        res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
      }
      const response =
        verdict.reason === 'origin' ? forbidden(verdict.message) : tooManyRequests(verdict.message);
      sendHttpResponse(res, response);
      return;
    }
    next();
  };
}
