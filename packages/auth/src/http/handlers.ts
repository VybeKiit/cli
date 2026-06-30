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

export type AuthHttpResponse =
  | { readonly status: 200 | 201; readonly body: AuthUser | { readonly ok: true } }
  | { readonly status: 400 | 401 | 500 | 502; readonly body: { readonly error: string } };

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

function userResponse(status: 200 | 201, user: AuthUser): AuthHttpResponse {
  return { status, body: user };
}

function errorResponse(status: 400 | 401 | 500 | 502, error: string): AuthHttpResponse {
  return { status, body: { error } };
}

export async function handleSignUp(
  body: { email?: string; password?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email, password } = body;
    if (!(email && password)) {
      return errorResponse(400, 'Enter your email and password.');
    }
    const result = await resolveAuth(deps).signUpWithPassword(email, password);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'signup' });
      return errorResponse(400, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('signup_completed', { method: 'password' });
    return userResponse(201, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'signup' });
    return errorResponse(500, 'Something went wrong. Try again.');
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
      return errorResponse(400, 'Enter your email and password.');
    }
    const result = await resolveAuth(deps).signInWithPassword(email, password);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'signin' });
      return errorResponse(401, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return userResponse(200, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'signin' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}

export async function handleSignOut(deps: AuthHttpDeps): Promise<AuthHttpResponse> {
  await deps.session.clearSession();
  return { status: 200, body: { ok: true } };
}

export async function handleMe(deps: AuthHttpDeps): Promise<AuthHttpResponse> {
  const token = await deps.session.readSession();
  if (!token) return errorResponse(401, 'Not signed in.');
  const result = await resolveAuth(deps).getUser(token);
  if (!result.ok) return errorResponse(401, result.error.message);
  return userResponse(200, result.value);
}

export async function handleSendEmailCode(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const { email } = body;
  if (!email) return errorResponse(400, 'Enter your email.');
  const result = await resolveAuth(deps).sendEmailCode(email);
  if (!result.ok) return errorResponse(502, result.error.message);
  return { status: 200, body: { ok: true } };
}

export async function handleVerifyEmailCode(
  body: { email?: string; code?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email, code } = body;
    if (!(email && code)) {
      return errorResponse(400, 'Enter the code we sent you.');
    }
    const result = await resolveAuth(deps).verifyEmailCode(email, code);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, { code: result.error.code, route: 'verify' });
      return errorResponse(401, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'email_code' });
    return userResponse(200, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'verify' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}

export async function handleForgotPassword(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    if (!email) return errorResponse(400, 'Enter your email address.');
    const result = await resolveAuth(deps).requestPasswordReset(email);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'forgot-password',
      });
      return errorResponse(400, result.error.message);
    }
    return { status: 200, body: { ok: true } };
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'forgot-password' });
    return errorResponse(500, 'Something went wrong. Try again.');
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
      return errorResponse(400, 'Enter your new password.');
    }
    const result = await resolveAuth(deps).resetPassword(token, newPassword);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'reset-password',
      });
      return errorResponse(400, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'password' });
    return userResponse(200, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'reset-password' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}

export async function handleSendMagicLink(
  body: { email?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { email } = body;
    if (!email) return errorResponse(400, 'Enter your email address.');
    const result = await resolveAuth(deps).sendMagicLink(email);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link',
      });
      return errorResponse(400, result.error.message);
    }
    return { status: 200, body: { ok: true } };
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'magic-link' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}

export async function handleVerifyMagicLink(
  body: { token?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { token } = body;
    if (!token) return errorResponse(400, 'That sign-in link is not valid.');
    const result = await resolveAuth(deps).verifyMagicLink(token);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link-verify',
      });
      return errorResponse(401, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'magic_link' });
    return userResponse(200, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'magic-link-verify' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}

export async function handleSendSmsCode(
  body: { phone?: string },
  deps: AuthHttpDeps,
): Promise<AuthHttpResponse> {
  const tel = telemetry(deps);
  try {
    const { phone } = body;
    if (!phone) return errorResponse(400, 'Enter your phone number.');
    const result = await resolveAuth(deps).sendSmsCode(phone);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'send-sms-code',
      });
      return errorResponse(400, result.error.message);
    }
    return { status: 200, body: { ok: true } };
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'send-sms-code' });
    return errorResponse(500, 'Something went wrong. Try again.');
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
      return errorResponse(400, 'Enter the code we sent you.');
    }
    const result = await resolveAuth(deps).verifySmsCode(phone, code);
    if (!result.ok) {
      tel.captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'verify-sms-code',
      });
      return errorResponse(401, result.error.message);
    }
    await persistSession(deps, result.value.sessionToken);
    tel.trackAuthEvent('sign_in_completed', { method: 'sms' });
    return userResponse(200, result.value.user);
  } catch (error) {
    tel.captureAuthFailure(error, { route: 'verify-sms-code' });
    return errorResponse(500, 'Something went wrong. Try again.');
  }
}
