import { postJson } from '@/lib/fetch-json';
import type { AuthUser } from '@vybekiit/auth';
import { type Result, fail, ok } from '@vybekiit/core';

/**
 * Buyer-facing auth wire points — the ONE file the `add-signin` skill touches.
 *
 * Each call POSTs to a server route under `/api/auth/*` that runs the real
 * `resolveAuthProvider()` from `@vybekiit/auth`. The provider code stays on the
 * server (those routes), so no secret or backend SDK ever reaches the client bundle.
 *
 * The no-secrets default is the **local** dev adapter (ADR-0008): with no `.env` the
 * screens work end-to-end against a fixed dev user, so the app is clickable in
 * session #1. The `add-signin` skill swaps to a real backend purely by setting env —
 * the routes resolve the new provider and these wire points don't change. Each call
 * returns a {@link Result} so the UI branches on `ok`.
 */

/** Server routes these wire points call; one place so they never drift. */
const ROUTES = {
  signIn: '/api/auth/signin',
  signUp: '/api/auth/signup',
  sendCode: '/api/auth/send-code',
  verify: '/api/auth/verify',
  signOut: '/api/auth/signout',
} as const;

/** Email + password sign-in. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  if (!(email && password)) return fail('invalid_input', 'auth.errors.enterEmailAndPassword');
  return postJson<AuthUser>(ROUTES.signIn, { email, password });
}

/** Create an account with email + password. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  if (!(email && password)) return fail('invalid_input', 'auth.errors.enterEmailAndPassword');
  return postJson<AuthUser>(ROUTES.signUp, { email, password });
}

/** Send a one-time sign-in code to an email address. */
export async function sendEmailCode(email: string): Promise<Result<true>> {
  if (!email) return fail('invalid_input', 'auth.errors.enterEmail');
  const result = await postJson<{ ok: true }>(ROUTES.sendCode, { email });
  return result.ok ? ok(true) : result;
}

/** Verify a one-time code and sign the builder in. */
export async function verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>> {
  if (!(email && code)) return fail('invalid_input', 'auth.errors.enterCode');
  return postJson<AuthUser>(ROUTES.verify, { email, code });
}

/** End the current session. */
export async function signOut(): Promise<Result<true>> {
  const result = await postJson<{ ok: true }>(ROUTES.signOut, {});
  return result.ok ? ok(true) : result;
}
