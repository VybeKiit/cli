import { createAuthClient } from '@vybekiit/auth/client';
import { postJson } from '@/lib/fetchJson';
import { clientError, legacyOutcomeToEffect } from '@/lib/clientEffect';

/**
 * Buyer-facing auth wire points — the ONE file the `add-signin` skill touches.
 *
 * POSTs to `/api/auth/*` on the Express backend (via `VITE_PUBLIC_APP_URL`).
 */

const postJsonEffect = <A>(url: string, body: unknown) =>
  legacyOutcomeToEffect(postJson<A>(url, body));

const client = createAuthClient(postJsonEffect, { inputError: clientError });

/**
 * Sign in with an email/password pair.
 *
 * @param email - Email address entered by the user.
 * @param password - Password entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with SpaClientError.
 * @example
 * const user = signInWithPassword(email, password);
 */
export const signInWithPassword = (email: string, password: string) =>
  client.signInWithPassword(email, password);

/**
 * Create an account with an email/password pair.
 *
 * @param email - Email address entered by the user.
 * @param password - Password entered by the user.
 * @returns An Effect that succeeds with the created user or fails with SpaClientError.
 * @example
 * const user = signUpWithPassword(email, password);
 */
export const signUpWithPassword = (email: string, password: string) =>
  client.signUpWithPassword(email, password);

/**
 * Send a one-time email verification code.
 *
 * @param email - Email address that should receive the code.
 * @returns An Effect that succeeds with true or fails with SpaClientError.
 * @example
 * const sent = sendEmailCode(email);
 */
export const sendEmailCode = (email: string) => client.sendEmailCode(email);

/**
 * Verify a one-time email code.
 *
 * @param email - Email address being verified.
 * @param code - Verification code entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with SpaClientError.
 * @example
 * const user = verifyEmailCode(email, code);
 */
export const verifyEmailCode = (email: string, code: string) => client.verifyEmailCode(email, code);

/**
 * Sign out the current user.
 *
 * @returns An Effect that succeeds with true or fails with SpaClientError.
 * @example
 * const signedOut = signOut();
 */
export const signOut = () => client.signOut();
