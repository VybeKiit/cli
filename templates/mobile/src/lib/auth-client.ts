import type { AuthUser } from '@vybekiit/auth';
import { type Result, fail } from '@vybekiit/core';

/**
 * Buyer-facing auth wire points — the ONE file the `add-signin` skill edits.
 *
 * These ship as marked stubs so the sign-in / sign-up / verify *screens* render
 * and the app builds with no secrets. When the builder asks to "add sign-in", the
 * agent replaces each body with a real `resolveAuthProvider()` call from
 * `@vybekiit/auth` (better-auth by default, reached over the app's API URL),
 * keeping every wire point in one place instead of scattered across the screens.
 * Each returns a {@link Result} so the UI branches on `ok`. Mirrors the web
 * template's `auth-client.ts` exactly so both platforms behave identically.
 */

/** Shared "not connected yet" failure shown until the add-signin skill runs. */
const NOT_WIRED = fail(
  'not_configured',
  'Sign-in is not connected yet. Ask your AI agent to "add sign-in".',
);

/**
 * Email + password sign-in.
 * TODO(vybekiit): wire to resolveAuthProvider() from `@vybekiit/auth` via a server route — skill: add-signin
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  if (!email || !password) return fail('invalid_input', 'Enter your email and password.');
  return NOT_WIRED;
}

/**
 * Create an account with email + password.
 * TODO(vybekiit): wire to resolveAuthProvider() from `@vybekiit/auth` via a server route — skill: add-signin
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  if (!email || !password) return fail('invalid_input', 'Enter your email and password.');
  return NOT_WIRED;
}

/**
 * Send a one-time sign-in code to an email address.
 * TODO(vybekiit): wire to `sendEmailCode` on resolveAuthProvider() from `@vybekiit/auth` — skill: add-signin
 */
export async function sendEmailCode(email: string): Promise<Result<true>> {
  if (!email) return fail('invalid_input', 'Enter your email.');
  return fail(
    'not_configured',
    'Email codes are not connected yet. Ask your AI agent to "add sign-in".',
  );
}

/**
 * Verify a one-time code and sign the builder in.
 * TODO(vybekiit): wire to `verifyEmailCode` on resolveAuthProvider() from `@vybekiit/auth` — skill: add-signin
 */
export async function verifyEmailCode(email: string, code: string): Promise<Result<AuthUser>> {
  if (!email || !code) return fail('invalid_input', 'Enter the code we sent you.');
  return NOT_WIRED;
}
