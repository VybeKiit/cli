import { decodeJsonBody } from '@vybekiit/core/http';
import { sendHttpResponse } from '@vybekiit/core/http/express';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { AuthHttpDeps } from './handlers';
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
import {
  EmailCodeBodySchema,
  EmailOnlyBodySchema,
  PhoneCodeBodySchema,
  PhoneOnlyBodySchema,
  ResetPasswordBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  TokenOnlyBodySchema,
} from './schemas';

export type {
  AuthHttpDeps,
  AuthHttpMethod,
  AuthHttpResponse,
  AuthHttpSession,
  AuthHttpTelemetry,
} from './handlers';

type ExpressDeps = AuthHttpDeps | ((req: Request, res: Response) => AuthHttpDeps);

function resolveDeps(deps: ExpressDeps, req: Request, res: Response): AuthHttpDeps {
  return typeof deps === 'function' ? deps(req, res) : deps;
}

function parseBody<A, I>(
  raw: unknown,
  schema: import('effect').Schema.Schema<A, I, never>,
  invalidMessage: string,
) {
  return decodeJsonBody(raw, schema, invalidMessage);
}

/** Mount on `/api/auth` — replaces duplicated Express auth controllers. */
export function createExpressAuthRouter(deps: ExpressDeps): Router {
  const router = createRouter();

  router.post('/signup', async (req, res) => {
    const parsed = parseBody(req.body, SignUpBodySchema, 'Enter your email and password.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleSignUp(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/signin', async (req, res) => {
    const parsed = parseBody(req.body, SignInBodySchema, 'Enter your email and password.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleSignIn(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/signout', async (req, res) => {
    sendHttpResponse(res, await handleSignOut(resolveDeps(deps, req, res)));
  });
  router.get('/me', async (req, res) => {
    sendHttpResponse(res, await handleMe(resolveDeps(deps, req, res)));
  });
  router.post('/send-code', async (req, res) => {
    const parsed = parseBody(req.body, EmailOnlyBodySchema, 'Enter your email.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleSendEmailCode(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/verify', async (req, res) => {
    const parsed = parseBody(req.body, EmailCodeBodySchema, 'Enter the code we sent you.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleVerifyEmailCode(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/forgot-password', async (req, res) => {
    const parsed = parseBody(req.body, EmailOnlyBodySchema, 'Enter your email address.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleForgotPassword(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/reset-password', async (req, res) => {
    const parsed = parseBody(req.body, ResetPasswordBodySchema, 'Enter your new password.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleResetPassword(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/magic-link', async (req, res) => {
    const parsed = parseBody(req.body, EmailOnlyBodySchema, 'Enter your email address.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleSendMagicLink(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/magic-link/verify', async (req, res) => {
    const parsed = parseBody(req.body, TokenOnlyBodySchema, 'That sign-in link is not valid.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleVerifyMagicLink(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/send-sms-code', async (req, res) => {
    const parsed = parseBody(req.body, PhoneOnlyBodySchema, 'Enter your phone number.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleSendSmsCode(parsed.body, resolveDeps(deps, req, res)));
  });
  router.post('/verify-sms-code', async (req, res) => {
    const parsed = parseBody(req.body, PhoneCodeBodySchema, 'Enter the code we sent you.');
    if (!parsed.ok) {
      sendHttpResponse(res, parsed.response);
      return;
    }
    sendHttpResponse(res, await handleVerifySmsCode(parsed.body, resolveDeps(deps, req, res)));
  });

  return router;
}
