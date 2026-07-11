import {
  decodeJsonBody,
  type JsonBodyResult,
  readRequestJson,
  toNextResponse,
} from '@vybekiit/core/http';
import type { Schema } from 'effect';
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

const parseBody = async <A, I>(
  request: Request,
  schema: Schema.Schema<A, I, never>,
  invalidMessage: string,
): Promise<JsonBodyResult<A>> => {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return json;
  }
  return decodeJsonBody(json.body, schema, invalidMessage);
};

/**
 * Create Next.js route handlers for the shared auth HTTP routes.
 *
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns Route handler functions ready for Next.js route files.
 * @example
 * const routes = createNextAuthRoutes(webAuthHttpDeps);
 */
export const createNextAuthRoutes = (deps: AuthHttpDeps) => ({
  signUp: async (request: Request) => {
    const parsed = await parseBody(request, SignUpBodySchema, 'Enter your email and password.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleSignUp(parsed.body, deps));
  },
  signIn: async (request: Request) => {
    const parsed = await parseBody(request, SignInBodySchema, 'Enter your email and password.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleSignIn(parsed.body, deps));
  },
  signOut: async () => toNextResponse(await handleSignOut(deps)),
  me: async () => toNextResponse(await handleMe(deps)),
  sendEmailCode: async (request: Request) => {
    const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleSendEmailCode(parsed.body, deps));
  },
  verifyEmailCode: async (request: Request) => {
    const parsed = await parseBody(request, EmailCodeBodySchema, 'Enter the code we sent you.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleVerifyEmailCode(parsed.body, deps));
  },
  forgotPassword: async (request: Request) => {
    const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email address.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleForgotPassword(parsed.body, deps));
  },
  resetPassword: async (request: Request) => {
    const parsed = await parseBody(request, ResetPasswordBodySchema, 'Enter your new password.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleResetPassword(parsed.body, deps));
  },
  sendMagicLink: async (request: Request) => {
    const parsed = await parseBody(request, EmailOnlyBodySchema, 'Enter your email address.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleSendMagicLink(parsed.body, deps));
  },
  verifyMagicLink: async (request: Request) => {
    const parsed = await parseBody(request, TokenOnlyBodySchema, 'That sign-in link is not valid.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleVerifyMagicLink(parsed.body, deps));
  },
  sendSmsCode: async (request: Request) => {
    const parsed = await parseBody(request, PhoneOnlyBodySchema, 'Enter your phone number.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleSendSmsCode(parsed.body, deps));
  },
  verifySmsCode: async (request: Request) => {
    const parsed = await parseBody(request, PhoneCodeBodySchema, 'Enter the code we sent you.');
    if (!parsed.ok) {
      return toNextResponse(parsed.response);
    }
    return toNextResponse(await handleVerifySmsCode(parsed.body, deps));
  },
});

export type NextAuthRoutes = ReturnType<typeof createNextAuthRoutes>;
