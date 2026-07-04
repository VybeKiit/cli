import { decodeJsonBody, readRequestJson, toNextResponse } from '@vybekiit/core/http';
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

export {
  EmailCodeBodySchema,
  EmailOnlyBodySchema,
  PhoneCodeBodySchema,
  PhoneOnlyBodySchema,
  ResetPasswordBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  TokenOnlyBodySchema,
} from './schemas';

async function parseBody<A, I>(
  request: Request,
  schema: import('effect').Schema.Schema<A, I, never>,
  invalidMessage: string,
) {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return json;
  }
  return decodeJsonBody(json.body, schema, invalidMessage);
}

export function createNextAuthRoutes(deps: AuthHttpDeps) {
  return {
    signUp: async (request: Request) => {
      const parsed = await parseBody(request, SignUpBodySchema, 'Enter your email and password.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleSignUp(parsed.body, deps));
    },
    signIn: async (request: Request) => {
      const parsed = await parseBody(request, SignInBodySchema, 'Enter your email and password.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleSignIn(parsed.body, deps));
    },
    signOut: async () => toNextResponse(await handleSignOut(deps)),
    me: async () => toNextResponse(await handleMe(deps)),
    sendEmailCode: async (request: Request) => {
      const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleSendEmailCode(parsed.body, deps));
    },
    verifyEmailCode: async (request: Request) => {
      const parsed = await parseBody(request, EmailCodeBodySchema, 'Enter the code we sent you.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleVerifyEmailCode(parsed.body, deps));
    },
    forgotPassword: async (request: Request) => {
      const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email address.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleForgotPassword(parsed.body, deps));
    },
    resetPassword: async (request: Request) => {
      const parsed = await parseBody(request, ResetPasswordBodySchema, 'Enter your new password.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleResetPassword(parsed.body, deps));
    },
    sendMagicLink: async (request: Request) => {
      const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email address.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleSendMagicLink(parsed.body, deps));
    },
    verifyMagicLink: async (request: Request) => {
      const parsed = await parseBody(
        request,
        TokenOnlyBodySchema,
        'That sign-in link is not valid.',
      );
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleVerifyMagicLink(parsed.body, deps));
    },
    sendSmsCode: async (request: Request) => {
      const parsed = await parseBody(request, PhoneOnlyBodySchema, 'Enter your phone number.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleSendSmsCode(parsed.body, deps));
    },
    verifySmsCode: async (request: Request) => {
      const parsed = await parseBody(request, PhoneCodeBodySchema, 'Enter the code we sent you.');
      if (!parsed.ok) return toNextResponse(parsed.response);
      return toNextResponse(await handleVerifySmsCode(parsed.body, deps));
    },
  };
}

export type NextAuthRoutes = ReturnType<typeof createNextAuthRoutes>;
