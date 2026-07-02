import {
  badInput,
  created,
  ok,
  serverError,
  unauthorized,
  upstreamFailed,
  type HttpResponse,
} from '@vybekiit/core/http';
import { Cause, Effect, Exit, Option } from 'effect';
import { resolveAuthProvider } from '../resolve';
import type { AuthError, AuthProvider } from '../types';
import type { AuthUser } from '../user';

export type AuthHttpMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

export type AuthHttpSession = {
  setSession(sessionToken: string): Promise<void> | void;
  readSession(): Promise<string | null> | string | null;
  clearSession(): Promise<void> | void;
};

export type AuthHttpTelemetry = {
  trackAuthEvent(
    name: 'signup_completed' | 'sign_in_completed',
    props: { method: AuthHttpMethod },
  ): void;
  captureAuthRejection(message: string, context?: Record<string, string | undefined>): void;
  captureAuthFailure(error: unknown, context?: Record<string, string | undefined>): void;
};

export type AuthHttpDeps = {
  resolveAuth?: () => AuthProvider;
  session: AuthHttpSession;
  telemetry?: AuthHttpTelemetry;
};

export type AuthHttpResponse = HttpResponse<AuthUser | { readonly ok: true }>;

function resolveAuth(deps: AuthHttpDeps): AuthProvider {
  return deps.resolveAuth?.() ?? resolveAuthProvider();
}

function noTelemetry(): AuthHttpTelemetry {
  return {
    trackAuthEvent: () => {},
    captureAuthRejection: () => {},
    captureAuthFailure: () => {},
  };
}

function telemetry(deps: AuthHttpDeps): AuthHttpTelemetry {
  return deps.telemetry ?? noTelemetry();
}

async function persistSession(deps: AuthHttpDeps, sessionToken: string): Promise<void> {
  await deps.session.setSession(sessionToken);
}

/**
 * The tagged {@link AuthError} from a failed run's cause, or `null` for an unexpected
 * defect. Handlers treat a tagged failure as an expected rejection (4xx) and re-throw a
 * defect into their `catch` so it surfaces as a 500 — the same split the old `try/catch`
 * around a thrown adapter drew.
 */
function authError(cause: Cause.Cause<AuthError>): AuthError | null {
  return Option.getOrNull(Cause.failureOption(cause));
}

export async function handleSignUp(
  body: { email?: string; password?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email, password } = body;
    if (!(email && password)) {
      return badInput('Enter your email and password.');
    }
    const exit = await Effect.runPromiseExit(resolveAuth(deps).signUpWithPassword(email, password));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'signup' });
      return badInput(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('signup_completed', { method: 'password' });
    return created(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'signup' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleSignIn(
  body: { email?: string; password?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email, password } = body;
    if (!(email && password)) {
      return badInput('Enter your email and password.');
    }
    const exit = await Effect.runPromiseExit(resolveAuth(deps).signInWithPassword(email, password));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'signin' });
      return unauthorized(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return ok(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'signin' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleSignOut(deps: AuthHttpDeps): Promise<AuthHttpResponse> {
  await deps.session.clearSession();
  return ok({ ok: true });
}

export async function handleMe(deps: AuthHttpDeps): Promise<AuthHttpResponse> {
  const token = await deps.session.readSession();
  if (!token) return unauthorized('Not signed in.');
  const exit = await Effect.runPromiseExit(resolveAuth(deps).getUser(token));
  if (Exit.isFailure(exit)) return unauthorized(authError(exit.cause)?.message ?? 'Not signed in.');
  return ok(exit.value);
}

export async function handleSendEmailCode(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const { email } = body;
  if (!email) return badInput('Enter your email.');
  const exit = await Effect.runPromiseExit(resolveAuth(deps).sendEmailCode(email));
  if (Exit.isFailure(exit)) {
    return upstreamFailed(authError(exit.cause)?.message ?? 'Could not send the code.');
  }
  return ok({ ok: true });
}

export async function handleVerifyEmailCode(
  body: { email?: string; code?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email, code } = body;
    if (!(email && code)) {
      return badInput('Enter the code we sent you.');
    }
    const exit = await Effect.runPromiseExit(resolveAuth(deps).verifyEmailCode(email, code));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'verify' });
      return unauthorized(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'email_code' });
    return ok(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'verify' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleForgotPassword(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    if (!email) return badInput('Enter your email address.');
    const exit = await Effect.runPromiseExit(resolveAuth(deps).requestPasswordReset(email));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'forgot-password' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'forgot-password' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleResetPassword(
  body: { token?: string; newPassword?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { token, newPassword } = body;
    if (!(token && newPassword)) {
      return badInput('Enter your new password.');
    }
    const exit = await Effect.runPromiseExit(resolveAuth(deps).resetPassword(token, newPassword));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'reset-password' });
      return badInput(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return ok(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'reset-password' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleSendMagicLink(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    if (!email) return badInput('Enter your email address.');
    const exit = await Effect.runPromiseExit(resolveAuth(deps).sendMagicLink(email));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'magic-link' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'magic-link' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleVerifyMagicLink(
  body: { token?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { token } = body;
    if (!token) return badInput('That sign-in link is not valid.');
    const exit = await Effect.runPromiseExit(resolveAuth(deps).verifyMagicLink(token));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'magic-link-verify' });
      return unauthorized(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'magic_link' });
    return ok(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'magic-link-verify' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleSendSmsCode(
  body: { phone?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { phone } = body;
    if (!phone) return badInput('Enter your phone number.');
    const exit = await Effect.runPromiseExit(resolveAuth(deps).sendSmsCode(phone));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'send-sms-code' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'send-sms-code' });
    return serverError('Something went wrong. Try again.');
  }
}

export async function handleVerifySmsCode(
  body: { phone?: string; code?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { phone, code } = body;
    if (!(phone && code)) {
      return badInput('Enter the code we sent you.');
    }
    const exit = await Effect.runPromiseExit(resolveAuth(deps).verifySmsCode(phone, code));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) throw Cause.squash(exit.cause);
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'verify-sms-code' });
      return unauthorized(failure.message);
    }
    await persistSession(deps, exit.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'sms' });
    return ok(exit.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'verify-sms-code' });
    return serverError('Something went wrong. Try again.');
  }
}
