import {
  badInput,
  created,
  ok,
  serverError,
  unauthorized,
  upstreamFailed,
  type HttpResponse,
} from '@vybekiit/http';
import { resolveAuthProvider } from '../resolve';
import type { AuthProvider } from '../types';
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
    const result = await resolveAuth(deps).signUpWithPassword(email, password);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'signup' });
      return badInput(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('signup_completed', { method: 'password' });
    return created(result.value.user);
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
    const result = await resolveAuth(deps).signInWithPassword(email, password);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'signin' });
      return unauthorized(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return ok(result.value.user);
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
  const result = await resolveAuth(deps).getUser(token);
  if (!result.ok) return unauthorized(result.error.message);
  return ok(result.value);
}

export async function handleSendEmailCode(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const { email } = body;
  if (!email) return badInput('Enter your email.');
  const result = await resolveAuth(deps).sendEmailCode(email);
  if (!result.ok) return upstreamFailed(result.error.message);
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
    const result = await resolveAuth(deps).verifyEmailCode(email, code);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'verify' });
      return unauthorized(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'email_code' });
    return ok(result.value.user);
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
    const result = await resolveAuth(deps).requestPasswordReset(email);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'forgot-password',
      });
      return badInput(result.error.message);
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
    const result = await resolveAuth(deps).resetPassword(token, newPassword);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'reset-password',
      });
      return badInput(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return ok(result.value.user);
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
    const result = await resolveAuth(deps).sendMagicLink(email);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link',
      });
      return badInput(result.error.message);
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
    const result = await resolveAuth(deps).verifyMagicLink(token);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link-verify',
      });
      return unauthorized(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'magic_link' });
    return ok(result.value.user);
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
    const result = await resolveAuth(deps).sendSmsCode(phone);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'send-sms-code',
      });
      return badInput(result.error.message);
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
    const result = await resolveAuth(deps).verifySmsCode(phone, code);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'verify-sms-code',
      });
      return unauthorized(result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'sms' });
    return ok(result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'verify-sms-code' });
    return serverError('Something went wrong. Try again.');
  }
}
