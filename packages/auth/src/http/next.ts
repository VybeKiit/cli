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

function toNextResponse(result: AuthHttpResponse): Response {
  return Response.json(result.body, { status: result.status });
}

async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function createNextAuthRoutes(deps: AuthHttpDeps) {
  return {
    signUp: async (request: Request) =>
      toNextResponse(await handleSignUp(await readJson(request), deps)),
    signIn: async (request: Request) =>
      toNextResponse(await handleSignIn(await readJson(request), deps)),
    signOut: async () => toNextResponse(await handleSignOut(deps)),
    me: async () => toNextResponse(await handleMe(deps)),
    sendEmailCode: async (request: Request) =>
      toNextResponse(await handleSendEmailCode(await readJson(request), deps)),
    verifyEmailCode: async (request: Request) =>
      toNextResponse(await handleVerifyEmailCode(await readJson(request), deps)),
    forgotPassword: async (request: Request) =>
      toNextResponse(await handleForgotPassword(await readJson(request), deps)),
    resetPassword: async (request: Request) =>
      toNextResponse(await handleResetPassword(await readJson(request), deps)),
    sendMagicLink: async (request: Request) =>
      toNextResponse(await handleSendMagicLink(await readJson(request), deps)),
    verifyMagicLink: async (request: Request) =>
      toNextResponse(await handleVerifyMagicLink(await readJson(request), deps)),
    sendSmsCode: async (request: Request) =>
      toNextResponse(await handleSendSmsCode(await readJson(request), deps)),
    verifySmsCode: async (request: Request) =>
      toNextResponse(await handleVerifySmsCode(await readJson(request), deps)),
  };
}

export type NextAuthRoutes = ReturnType<typeof createNextAuthRoutes>;
