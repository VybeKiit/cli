import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { AuthHttpDeps, AuthHttpResponse } from './handlers';
import {
  handleForgotPassword,
  handleMe,
  handleResetPassword,
  handleSendEmailCode,
  handleSendMagicLink,
  handleSendSmsCode,
  handleSignIn,
  handleSignOut,
  handleSignUp,
  handleVerifyEmailCode,
  handleVerifyMagicLink,
  handleVerifySmsCode,
} from './handlers';

export type {
  AuthHttpDeps,
  AuthHttpMethod,
  AuthHttpResponse,
  AuthHttpSession,
  AuthHttpTelemetry,
} from './handlers';

type ExpressDeps = AuthHttpDeps | ((req: Request, res: Response) => AuthHttpDeps);

function send(res: Response, result: AuthHttpResponse): void {
  res.status(result.status).json(result.body);
}

async function readBody<T extends Record<string, unknown>>(req: Request): Promise<T> {
  return req.body as T;
}

function resolveDeps(deps: ExpressDeps, req: Request, res: Response): AuthHttpDeps {
  return typeof deps === 'function' ? deps(req, res) : deps;
}

/** Mount on `/api/auth` — replaces duplicated Express auth controllers. */
export function createExpressAuthRouter(deps: ExpressDeps): Router {
  const router = createRouter();

  router.post('/signup', async (req, res) => {
    send(res, await handleSignUp(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/signin', async (req, res) => {
    send(res, await handleSignIn(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/signout', async (req, res) => {
    send(res, await handleSignOut(resolveDeps(deps, req, res)));
  });
  router.get('/me', async (req, res) => {
    send(res, await handleMe(resolveDeps(deps, req, res)));
  });
  router.post('/send-code', async (req, res) => {
    send(res, await handleSendEmailCode(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/verify', async (req, res) => {
    send(res, await handleVerifyEmailCode(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/forgot-password', async (req, res) => {
    send(res, await handleForgotPassword(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/reset-password', async (req, res) => {
    send(res, await handleResetPassword(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/magic-link', async (req, res) => {
    send(res, await handleSendMagicLink(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/magic-link/verify', async (req, res) => {
    send(res, await handleVerifyMagicLink(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/send-sms-code', async (req, res) => {
    send(res, await handleSendSmsCode(await readBody(req), resolveDeps(deps, req, res)));
  });
  router.post('/verify-sms-code', async (req, res) => {
    send(res, await handleVerifySmsCode(await readBody(req), resolveDeps(deps, req, res)));
  });

  return router;
}
