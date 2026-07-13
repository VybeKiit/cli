import { AuthUserSchema } from '@vybekiit/auth/user';
import { HttpErrorBodySchema } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { AUTH_ROUTES, AuthAckSchema } from './contract';

/** The full generated auth surface, as `METHOD path` strings. */
const EXPECTED_SURFACE = [
  'GET /api/auth/me',
  'POST /api/auth/forgot-password',
  'POST /api/auth/magic-link',
  'POST /api/auth/magic-link/verify',
  'POST /api/auth/reset-password',
  'POST /api/auth/send-code',
  'POST /api/auth/send-sms-code',
  'POST /api/auth/signin',
  'POST /api/auth/signout',
  'POST /api/auth/signup',
  'POST /api/auth/verify',
  'POST /api/auth/verify-sms-code',
];

const routeFor = (operationId: string) =>
  AUTH_ROUTES.find((route) => route.operationId === operationId);

describe('auth route registry', () => {
  it('registers the exact generated /api/auth surface with unique operation ids', () => {
    const surface = AUTH_ROUTES.map((route) => `${route.method} ${route.path}`).sort();
    expect(surface).toEqual([...EXPECTED_SURFACE].sort());

    const ids = AUTH_ROUTES.map((route) => route.operationId);
    expect(new Set(ids).size).toBe(AUTH_ROUTES.length);
  });

  it('defaults every route to the shared error envelope', () => {
    for (const route of AUTH_ROUTES) {
      expect(route.error).toBe(HttpErrorBodySchema);
    }
  });

  it('maps session routes to the user schema and send-only routes to the ack schema', () => {
    expect(routeFor('auth.signIn')?.response).toBe(AuthUserSchema);
    expect(routeFor('auth.me')?.response).toBe(AuthUserSchema);
    expect(routeFor('auth.me')?.request).toBeUndefined();
    expect(routeFor('auth.sendEmailCode')?.response).toBe(AuthAckSchema);
    expect(routeFor('auth.signOut')?.response).toBe(AuthAckSchema);
  });

  it('registered schemas decode representative payloads', () => {
    const signUp = routeFor('auth.signUp');
    expect(signUp?.request).toBeDefined();
    if (signUp?.request !== undefined) {
      expect(
        Schema.decodeUnknownSync(signUp.request)({ email: 'a@b.com', password: 'pw123456' }),
      ).toEqual({ email: 'a@b.com', password: 'pw123456' });
    }
    expect(Schema.decodeUnknownSync(AuthAckSchema)({ ok: true })).toEqual({ ok: true });
    expect(Schema.decodeUnknownSync(AuthUserSchema)({ id: 'u1', email: null })).toEqual({
      id: 'u1',
      email: null,
    });
  });
});
