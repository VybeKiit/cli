import { AUTH_ROUTES } from '@vybekiit/auth/http';
import { HttpErrorBodySchema, toOpenApiDocument } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { cookieFrom, type Loopback, startLoopback } from '../support/loopback.js';

/**
 * Endpoint contract test (ADR-0042): drive every generated auth route over a real
 * socket on the deterministic local adapter (ADR-0008), asserting each route's
 * HTTP contract and the session-cookie guard — no secrets, no network. Proves the
 * backend's verifiable auth surface: password, email-OTP, magic-link,
 * password-reset, and SMS-OTP, plus the session guard.
 *
 * Every live response is also decoded against its registered response Schema
 * (ADR-0042 §5 / ADR-0043 §6), so the running server cannot drift from the route
 * registry the OpenAPI document and typed client derive from.
 */

/** Deterministic identity the local auth adapter returns for any credentials. */
const DEV_USER = { id: 'local-dev-user', email: 'you@local.dev' } as const;
/** Session cookie name shared with the web/mobile templates. */
const SESSION_COOKIE = 'vk_session';
/** Fixed session value the local adapter issues (`LOCAL_DEV_SESSION_TOKEN`). */
const EXPECTED_SESSION_VALUE = 'local-dev-session';
/** `name=value` pair a session-issuing route is expected to set. */
const SESSION_SET = `${SESSION_COOKIE}=${EXPECTED_SESSION_VALUE}`;

/** Look up a registered route's response Schema by operation id. */
const responseSchemaFor = (operationId: string): Schema.Schema.AnyNoContext => {
  const route = AUTH_ROUTES.find((entry) => entry.operationId === operationId);
  if (route === undefined) {
    throw new Error(`No registered auth route for ${operationId}.`);
  }
  return route.response;
};

/** Decode a live success body against the route's registered response Schema, returning it. */
const decodeResponse = (operationId: string, body: unknown): unknown =>
  Schema.decodeUnknownSync(responseSchemaFor(operationId))(body);

/** Decode a live error body against the shared `{ code, error }` envelope Schema. */
const decodeError = (body: unknown): { readonly code: string; readonly error: string } =>
  Schema.decodeUnknownSync(HttpErrorBodySchema)(body);

/** Restore a captured env var to its prior value, or delete it if unset before. */
const restoreEnv = (key: string, previous: string | undefined): void => {
  if (previous === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = previous;
};

const priorNodeEnv = process.env.NODE_ENV;
const priorAuthProvider = process.env.AUTH_PROVIDER;
let loopback: Loopback;

const postJson = (
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<Response> =>
  fetch(loopback.url(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
  });

beforeAll(async () => {
  // Pin the deterministic local adapter and a dev NODE_ENV: parseEnv(appConfigSchema)
  // only accepts 'development' | 'production', and dev keeps cookies non-`secure` over http.
  process.env.NODE_ENV = 'development';
  process.env.AUTH_PROVIDER = 'local';
  loopback = await startLoopback(createApp());
});

afterAll(async () => {
  await loopback.close();
  restoreEnv('NODE_ENV', priorNodeEnv);
  restoreEnv('AUTH_PROVIDER', priorAuthProvider);
});

describe('auth HTTP contract — core session routes', () => {
  it('GET /health returns the health payload', async () => {
    const response = await fetch(loopback.url('/health'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: 'healthy' });
  });

  it('POST /api/auth/signup creates a session and returns the user', async () => {
    const response = await postJson('/api/auth/signup', {
      email: 'new@local.dev',
      password: 'pw-123456',
    });

    expect(response.status).toBe(201);
    expect(decodeResponse('auth.signUp', await response.json())).toEqual(DEV_USER);
    expect(cookieFrom(response, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('POST /api/auth/signin returns the user and sets the session cookie', async () => {
    const response = await postJson('/api/auth/signin', {
      email: 'you@local.dev',
      password: 'pw-123456',
    });

    expect(response.status).toBe(200);
    expect(decodeResponse('auth.signIn', await response.json())).toEqual(DEV_USER);
    expect(cookieFrom(response, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('GET /api/auth/me rejects a request with no session (the guard)', async () => {
    const response = await fetch(loopback.url('/api/auth/me'));

    expect(response.status).toBe(401);
    expect(decodeError(await response.json()).code).toBe('unauthorized');
  });

  it('GET /api/auth/me returns the user when the session cookie is present', async () => {
    const signIn = await postJson('/api/auth/signin', {
      email: 'you@local.dev',
      password: 'pw-123456',
    });
    const cookie = cookieFrom(signIn, SESSION_COOKIE);
    expect(cookie).toBeDefined();

    const response = await fetch(loopback.url('/api/auth/me'), {
      headers: cookie === undefined ? {} : { cookie },
    });

    expect(response.status).toBe(200);
    expect(decodeResponse('auth.me', await response.json())).toEqual(DEV_USER);
  });

  it('POST /api/auth/signout clears the session cookie', async () => {
    const response = await postJson('/api/auth/signout');

    expect(response.status).toBe(200);
    expect(decodeResponse('auth.signOut', await response.json())).toEqual({ ok: true });
    expect(cookieFrom(response, SESSION_COOKIE)).toBe(`${SESSION_COOKIE}=`);
  });
});

describe('auth HTTP contract — passwordless & recovery routes', () => {
  it('email-OTP: send-code acknowledges, verify signs in', async () => {
    const send = await postJson('/api/auth/send-code', { email: 'you@local.dev' });
    expect(send.status).toBe(200);
    expect(decodeResponse('auth.sendEmailCode', await send.json())).toEqual({ ok: true });

    const verify = await postJson('/api/auth/verify', { email: 'you@local.dev', code: '123456' });
    expect(verify.status).toBe(200);
    expect(decodeResponse('auth.verifyEmailCode', await verify.json())).toEqual(DEV_USER);
    expect(cookieFrom(verify, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('password-reset: forgot-password acknowledges, reset-password signs in', async () => {
    const forgot = await postJson('/api/auth/forgot-password', { email: 'you@local.dev' });
    expect(forgot.status).toBe(200);
    expect(decodeResponse('auth.requestPasswordReset', await forgot.json())).toEqual({ ok: true });

    const reset = await postJson('/api/auth/reset-password', {
      token: 'local-reset-token',
      newPassword: 'pw-abcdef',
    });
    expect(reset.status).toBe(200);
    expect(decodeResponse('auth.resetPassword', await reset.json())).toEqual(DEV_USER);
    expect(cookieFrom(reset, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('magic-link: request acknowledges, verify signs in', async () => {
    const request = await postJson('/api/auth/magic-link', { email: 'you@local.dev' });
    expect(request.status).toBe(200);
    expect(decodeResponse('auth.sendMagicLink', await request.json())).toEqual({ ok: true });

    const verify = await postJson('/api/auth/magic-link/verify', { token: 'local-magic-token' });
    expect(verify.status).toBe(200);
    expect(decodeResponse('auth.verifyMagicLink', await verify.json())).toEqual(DEV_USER);
    expect(cookieFrom(verify, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('SMS-OTP: send-sms-code acknowledges, verify-sms-code signs in', async () => {
    const send = await postJson('/api/auth/send-sms-code', { phone: '+15555550123' });
    expect(send.status).toBe(200);
    expect(decodeResponse('auth.sendSmsCode', await send.json())).toEqual({ ok: true });

    const verify = await postJson('/api/auth/verify-sms-code', {
      phone: '+15555550123',
      code: '123456',
    });
    expect(verify.status).toBe(200);
    expect(decodeResponse('auth.verifySmsCode', await verify.json())).toEqual(DEV_USER);
    expect(cookieFrom(verify, SESSION_COOKIE)).toBe(SESSION_SET);
  });

  it('rejects a malformed body with a 400 bad-input outcome', async () => {
    const response = await postJson('/api/auth/signup', { email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(decodeError(await response.json()).code).toBe('bad_input');
  });
});

describe('auth contract → generated OpenAPI', () => {
  it('emits an OpenAPI 3.1 document covering every registered auth route', () => {
    const doc = toOpenApiDocument(AUTH_ROUTES, { title: 'VybeKiit API', version: '0.0.0-test' });
    expect(doc.openapi).toBe('3.1.0');

    const emitted = new Set<string>();
    for (const [path, item] of Object.entries(doc.paths)) {
      for (const method of Object.keys(item)) {
        emitted.add(`${method.toUpperCase()} ${path}`);
      }
    }
    for (const route of AUTH_ROUTES) {
      expect(emitted).toContain(`${route.method} ${route.path}`);
    }
  });
});
