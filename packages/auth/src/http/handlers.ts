import { resolveAuthProvider } from '@vybekiit/auth/resolve';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import type { AuthUser } from '@vybekiit/auth/user';
import {
  badInput,
  created,
  type HttpResponse,
  ok,
  serverError,
  unauthorized,
  upstreamFailed,
} from '@vybekiit/core/http';
import { Cause, Effect, Exit, Option } from 'effect';
import type {
  EmailCodeBody,
  EmailOnlyBody,
  PhoneCodeBody,
  PhoneOnlyBody,
  ResetPasswordBody,
  SignInBody,
  SignUpBody,
  TokenOnlyBody,
} from './schemas';

export type AuthHttpMethod = 'password' | 'magic_link' | 'sms' | 'email_code';

/** Session persistence hooks supplied by the host framework. */
export type AuthHttpSession = {
  readonly setSession: (sessionToken: string) => Promise<void> | void;
  readonly readSession: () => Promise<string | null> | string | null;
  readonly clearSession: () => Promise<void> | void;
};

/** Telemetry hooks used by shared auth HTTP handlers. */
export type AuthHttpTelemetry = {
  readonly trackAuthEvent: (
    name: 'signup_completed' | 'sign_in_completed',
    props: { method: AuthHttpMethod },
  ) => void;
  readonly captureAuthRejection: (
    message: string,
    context?: Record<string, string | undefined>,
  ) => void;
  readonly captureAuthFailure: (
    error: unknown,
    context?: Record<string, string | undefined>,
  ) => void;
};

/** Dependencies each auth HTTP handler needs from the host framework. */
export type AuthHttpDeps = {
  readonly resolveAuth?: () => Effect.Effect<AuthProvider, AuthError>;
  readonly session: AuthHttpSession;
  readonly telemetry?: AuthHttpTelemetry;
};

export type AuthHttpResponse = HttpResponse<AuthUser | { readonly ok: true }>;

const resolveAuth = (deps: AuthHttpDeps): Effect.Effect<AuthProvider, AuthError> => {
  if (deps.resolveAuth !== undefined) {
    return deps.resolveAuth();
  }

  return resolveAuthProvider();
};

const noopTelemetry = (): void => undefined;

const noTelemetry = (): AuthHttpTelemetry => ({
  trackAuthEvent: noopTelemetry,
  captureAuthRejection: noopTelemetry,
  captureAuthFailure: noopTelemetry,
});

const telemetry = (deps: AuthHttpDeps): AuthHttpTelemetry => {
  if (deps.telemetry !== undefined) {
    return deps.telemetry;
  }

  return noTelemetry();
};

const persistSession = async (deps: AuthHttpDeps, sessionToken: string): Promise<void> => {
  await deps.session.setSession(sessionToken);
};

/**
 * The tagged {@link AuthError} from a failed run's cause, or `null` for an unexpected
 * defect. Handlers treat a tagged failure as an expected rejection (4xx) and re-throw a
 * defect into their `catch` so it surfaces as a 500 — the same split the old `try/catch`
 * around a thrown adapter drew.
 */
const authError = (cause: Cause.Cause<AuthError>): AuthError | null => {
  const failure = Option.getOrNull(Cause.failureOption(cause));

  if (failure?.code === 'auth_config_invalid') {
    return null;
  }

  return failure;
};

const runAuth = <A>(
  deps: AuthHttpDeps,
  useAuth: (provider: AuthProvider) => Effect.Effect<A, AuthError>,
): Promise<Exit.Exit<A, AuthError>> =>
  Effect.runPromiseExit(resolveAuth(deps).pipe(Effect.flatMap(useAuth)));

/**
 * Handle an email/password sign-up request.
 *
 * @param body - Validated sign-up request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleSignUp(body, deps);
 */
export const handleSignUp = async (
  body: SignUpBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { email, password } = body;
    const exit = await runAuth(deps, (auth) => auth.signUpWithPassword(email, password));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};

/**
 * Handle an email/password sign-in request.
 *
 * @param body - Validated sign-in request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleSignIn(body, deps);
 */
export const handleSignIn = async (
  body: SignInBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { email, password } = body;
    const exit = await runAuth(deps, (auth) => auth.signInWithPassword(email, password));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};

/**
 * Handle a sign-out request by clearing the persisted session.
 *
 * @param deps - Auth HTTP dependencies for session persistence.
 * @returns The HTTP response confirming sign-out.
 * @example
 * const response = await handleSignOut(deps);
 */
export const handleSignOut = async (deps: AuthHttpDeps): Promise<AuthHttpResponse> => {
  await deps.session.clearSession();
  return ok({ ok: true });
};

/**
 * Handle a current-user request using the persisted session token.
 *
 * @param deps - Auth HTTP dependencies for provider and session access.
 * @returns The current user response, or an unauthorized response.
 * @example
 * const response = await handleMe(deps);
 */
export const handleMe = async (deps: AuthHttpDeps): Promise<AuthHttpResponse> => {
  const token = await deps.session.readSession();
  if (!token) {
    return unauthorized('Not signed in.');
  }
  const exit = await runAuth(deps, (auth) => auth.getUser(token));
  if (Exit.isFailure(exit)) {
    const failure = authError(exit.cause);

    if (failure === null) {
      return serverError('Something went wrong. Try again.');
    }

    return unauthorized(failure.message);
  }
  return ok(exit.value);
};

/**
 * Handle a request to send an email verification code.
 *
 * @param body - Validated email-only request body.
 * @param deps - Auth HTTP dependencies for provider access.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleSendEmailCode(body, deps);
 */
export const handleSendEmailCode = async (
  body: EmailOnlyBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const { email } = body;
  const exit = await runAuth(deps, (auth) => auth.sendEmailCode(email));
  if (Exit.isFailure(exit)) {
    const failure = authError(exit.cause);

    if (failure === null) {
      return serverError('Something went wrong. Try again.');
    }

    return upstreamFailed(failure.message);
  }
  return ok({ ok: true });
};

/**
 * Handle an email-code verification request.
 *
 * @param body - Validated email-code request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleVerifyEmailCode(body, deps);
 */
export const handleVerifyEmailCode = async (
  body: EmailCodeBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { email, code } = body;
    const exit = await runAuth(deps, (auth) => auth.verifyEmailCode(email, code));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};

/**
 * Handle a password-reset request.
 *
 * @param body - Validated email-only request body.
 * @param deps - Auth HTTP dependencies for provider and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleForgotPassword(body, deps);
 */
export const handleForgotPassword = async (
  body: EmailOnlyBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    const exit = await runAuth(deps, (auth) => auth.requestPasswordReset(email));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'forgot-password' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'forgot-password' });
    return serverError('Something went wrong. Try again.');
  }
};

/**
 * Handle a password-reset completion request.
 *
 * @param body - Validated reset-password request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleResetPassword(body, deps);
 */
export const handleResetPassword = async (
  body: ResetPasswordBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { token, newPassword } = body;
    const exit = await runAuth(deps, (auth) => auth.resetPassword(token, newPassword));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};

/**
 * Handle a magic-link send request.
 *
 * @param body - Validated email-only request body.
 * @param deps - Auth HTTP dependencies for provider and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleSendMagicLink(body, deps);
 */
export const handleSendMagicLink = async (
  body: EmailOnlyBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    const exit = await runAuth(deps, (auth) => auth.sendMagicLink(email));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'magic-link' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'magic-link' });
    return serverError('Something went wrong. Try again.');
  }
};

/**
 * Handle a magic-link verification request.
 *
 * @param body - Validated token-only request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleVerifyMagicLink(body, deps);
 */
export const handleVerifyMagicLink = async (
  body: TokenOnlyBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { token } = body;
    const exit = await runAuth(deps, (auth) => auth.verifyMagicLink(token));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};

/**
 * Handle an SMS-code send request.
 *
 * @param body - Validated phone-only request body.
 * @param deps - Auth HTTP dependencies for provider and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleSendSmsCode(body, deps);
 */
export const handleSendSmsCode = async (
  body: PhoneOnlyBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { phone } = body;
    const exit = await runAuth(deps, (auth) => auth.sendSmsCode(phone));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
      tel.captureAuthRejection(failure.message, { code: failure.code, route: 'send-sms-code' });
      return badInput(failure.message);
    }
    return ok({ ok: true });
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'send-sms-code' });
    return serverError('Something went wrong. Try again.');
  }
};

/**
 * Handle an SMS-code verification request.
 *
 * @param body - Validated phone-code request body.
 * @param deps - Auth HTTP dependencies for provider, session, and telemetry.
 * @returns The HTTP response to send to the caller.
 * @example
 * const response = await handleVerifySmsCode(body, deps);
 */
export const handleVerifySmsCode = async (
  body: PhoneCodeBody,
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  try {
    const { phone, code } = body;
    const exit = await runAuth(deps, (auth) => auth.verifySmsCode(phone, code));
    if (Exit.isFailure(exit)) {
      const failure = authError(exit.cause);
      if (!failure) {
        throw Cause.squash(exit.cause);
      }
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
};
