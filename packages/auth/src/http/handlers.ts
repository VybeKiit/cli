import { resolveAuthProvider } from '@vybekiit/auth/resolve';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import type { AuthUser } from '@vybekiit/auth/user';
import { created, type HttpResponse, ok, runEffectHttp, unauthorized } from '@vybekiit/core/http';
import { Effect } from 'effect';
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

const authDefectCodes = new Set(['auth_config_invalid']);

/**
 * Run an auth domain Effect at the HTTP composition root via {@link runEffectHttp}.
 *
 * @param deps - Auth HTTP dependencies.
 * @param useAuth - Domain program given a resolved AuthProvider.
 * @param options - Success mapper, failure outcome, route id for telemetry.
 * @returns HTTP response for the route adapter.
 */
const runAuthHttp = async <A>(
  deps: AuthHttpDeps,
  useAuth: (provider: AuthProvider) => Effect.Effect<A, AuthError>,
  options: {
    readonly onSuccess: (value: A) => AuthHttpResponse | Promise<AuthHttpResponse>;
    readonly defaultOutcome: 'bad_input' | 'unauthorized' | 'upstream_failed';
    readonly route: string;
  },
): Promise<AuthHttpResponse> => {
  const tel = telemetry(deps);
  const response = await runEffectHttp({
    program: resolveAuth(deps).pipe(Effect.flatMap(useAuth)),
    onSuccess: options.onSuccess,
    failurePolicy: {
      defaultOutcome: options.defaultOutcome,
      defectCodes: authDefectCodes,
    },
    onRejection: (failure) => {
      tel.captureAuthRejection(failure.message, { code: failure.code, route: options.route });
    },
    onDefect: (error) => {
      tel.captureAuthFailure(error, { route: options.route });
    },
  });
  return response as AuthHttpResponse;
};

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
  const { email, password } = body;
  return runAuthHttp(deps, (auth) => auth.signUpWithPassword(email, password), {
    route: 'signup',
    defaultOutcome: 'bad_input',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('signup_completed', { method: 'password' });
      return created(session.user);
    },
  });
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
  const { email, password } = body;
  return runAuthHttp(deps, (auth) => auth.signInWithPassword(email, password), {
    route: 'signin',
    defaultOutcome: 'unauthorized',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('sign_in_completed', { method: 'password' });
      return ok(session.user);
    },
  });
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
  return runAuthHttp(deps, (auth) => auth.getUser(token), {
    route: 'me',
    defaultOutcome: 'unauthorized',
    onSuccess: (user) => ok(user),
  });
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
  return runAuthHttp(deps, (auth) => auth.sendEmailCode(email), {
    route: 'send-email-code',
    defaultOutcome: 'upstream_failed',
    onSuccess: () => ok({ ok: true }),
  });
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
  const { email, code } = body;
  return runAuthHttp(deps, (auth) => auth.verifyEmailCode(email, code), {
    route: 'verify',
    defaultOutcome: 'unauthorized',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('sign_in_completed', { method: 'email_code' });
      return ok(session.user);
    },
  });
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
  const { email } = body;
  return runAuthHttp(deps, (auth) => auth.requestPasswordReset(email), {
    route: 'forgot-password',
    defaultOutcome: 'bad_input',
    onSuccess: () => ok({ ok: true }),
  });
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
  const { token, newPassword } = body;
  return runAuthHttp(deps, (auth) => auth.resetPassword(token, newPassword), {
    route: 'reset-password',
    defaultOutcome: 'bad_input',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('sign_in_completed', { method: 'password' });
      return ok(session.user);
    },
  });
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
  const { email } = body;
  return runAuthHttp(deps, (auth) => auth.sendMagicLink(email), {
    route: 'magic-link',
    defaultOutcome: 'bad_input',
    onSuccess: () => ok({ ok: true }),
  });
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
  const { token } = body;
  return runAuthHttp(deps, (auth) => auth.verifyMagicLink(token), {
    route: 'magic-link-verify',
    defaultOutcome: 'unauthorized',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('sign_in_completed', { method: 'magic_link' });
      return ok(session.user);
    },
  });
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
  const { phone } = body;
  return runAuthHttp(deps, (auth) => auth.sendSmsCode(phone), {
    route: 'send-sms-code',
    defaultOutcome: 'bad_input',
    onSuccess: () => ok({ ok: true }),
  });
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
  const { phone, code } = body;
  return runAuthHttp(deps, (auth) => auth.verifySmsCode(phone, code), {
    route: 'verify-sms-code',
    defaultOutcome: 'unauthorized',
    onSuccess: async (session) => {
      await deps.session.setSession(session.sessionToken);
      tel.trackAuthEvent('sign_in_completed', { method: 'sms' });
      return ok(session.user);
    },
  });
};
