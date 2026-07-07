import { appConfigSchema, parseEnv } from '@vybekiit/core/config';
import { forbidden, tooManyRequests } from '@vybekiit/core/http';
import { sendHttpResponse } from '@vybekiit/core/http/express';
import type { NextFunction, Request, Response } from 'express';
import { SecurityGuard } from './guard';
import { resolveSecurityPolicy } from './policy';
import type { SecurityRequest } from './types';

/**
 * Resolve the caller id used by the in-memory rate limiter.
 *
 * @param req - Express request to inspect.
 * @returns The forwarded IP, request IP, or `unknown`.
 * @example
 * const clientId = clientIdFromRequest(req);
 */
const clientIdFromRequest = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const [firstForwarded] = forwarded.split(',');
    if (firstForwarded !== undefined) {
      const trimmed = firstForwarded.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    return 'unknown';
  }
  if (req.ip !== undefined) {
    return req.ip;
  }
  return 'unknown';
};

/**
 * Convert an Express request into the framework-neutral security shape.
 *
 * @param req - Express request to convert.
 * @param appOrigin - Canonical application origin.
 * @returns A security request consumed by {@link SecurityGuard}.
 * @example
 * const securityRequest = toSecurityRequest(req, appOrigin);
 */
const toSecurityRequest = (req: Request, appOrigin: string): SecurityRequest => ({
  method: req.method,
  originHeader: typeof req.headers.origin === 'string' ? req.headers.origin : null,
  appOrigin,
  clientId: clientIdFromRequest(req),
  path: req.path.startsWith('/api') ? req.path : `/api${req.path}`,
});

/**
 * Resolve the default app origin from core config.
 *
 * @returns The configured `APP_URL`, including the schema default.
 * @example
 * const appOrigin = resolveDefaultAppOrigin();
 */
const resolveDefaultAppOrigin = (): string => parseEnv(appConfigSchema).APP_URL;

/** Options for Express security middleware creation. */
export type ExpressSecurityOptions = {
  /** Guard instance to reuse; omitted creates one from env-backed policy. */
  readonly guard?: SecurityGuard;
  /** Canonical app origin for same-origin lock (defaults to APP_URL env). */
  readonly appOrigin?: string;
};

/**
 * Create Express middleware for rate limits and same-origin locking.
 *
 * @param options - Optional guard and canonical app origin.
 * @returns Express middleware that blocks disallowed requests or calls `next`.
 * @example
 * app.use(createExpressSecurityMiddleware({ appOrigin: 'https://app.test' }));
 */
export const createExpressSecurityMiddleware = (
  options: ExpressSecurityOptions = {},
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const { appOrigin: optionAppOrigin, guard: optionGuard } = options;
  const guard =
    optionGuard === undefined ? new SecurityGuard(resolveSecurityPolicy()) : optionGuard;
  const appOrigin = optionAppOrigin === undefined ? resolveDefaultAppOrigin() : optionAppOrigin;

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
};
