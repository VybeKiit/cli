import { createAuthClient } from '@vybekiit/auth/client';
import { clientError, legacyOutcomeToEffect } from '@/lib/clientEffect';
import { postJson } from '@/lib/fetchJson';

/**
 * Buyer-facing auth wire points — the ONE file the `connect-account` skill edits.
 *
 * POSTs to `/api/auth/*` on the builder's web backend (via `APP_URL`). Mirrors
 * the web template's `authClient.ts` so both platforms behave identically.
 */

const postJsonEffect = <A>(url: string, body: unknown) =>
  legacyOutcomeToEffect(postJson<A>(url, body));

const client = createAuthClient(postJsonEffect, { inputError: clientError });

/**
 * Sign in with an email/password pair.
 *
 * @param email - Email address entered by the user.
 * @param password - Password entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with MobileClientError.
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
 * @returns An Effect that succeeds with the created user or fails with MobileClientError.
 * @example
 * const user = signUpWithPassword(email, password);
 */
export const signUpWithPassword = (email: string, password: string) =>
  client.signUpWithPassword(email, password);

/**
 * Send a one-time email verification code.
 *
 * @param email - Email address that should receive the code.
 * @returns An Effect that succeeds with true or fails with MobileClientError.
 * @example
 * const sent = sendEmailCode(email);
 */
export const sendEmailCode = (email: string) => client.sendEmailCode(email);

/**
 * Verify a one-time email code.
 *
 * @param email - Email address being verified.
 * @param code - Verification code entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with MobileClientError.
 * @example
 * const user = verifyEmailCode(email, code);
 */
export const verifyEmailCode = (email: string, code: string) => client.verifyEmailCode(email, code);

/**
 * Sign out the current user.
 *
 * @returns An Effect that succeeds with true or fails with MobileClientError.
 * @example
 * const signedOut = signOut();
 */
export const signOut = () => client.signOut();

/**
 * Request a password-reset link or code.
 *
 * @param email - Email address to send the reset to.
 * @returns An Effect that succeeds with true or fails with MobileClientError.
 * @example
 * const sent = requestPasswordReset(email);
 */
export const requestPasswordReset = (email: string) => client.requestPasswordReset(email);

/**
 * Complete a password reset with a token and new password.
 *
 * @param token - Reset token from the email link.
 * @param newPassword - New password entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with MobileClientError.
 * @example
 * const user = resetPassword(token, newPassword);
 */
export const resetPassword = (token: string, newPassword: string) =>
  client.resetPassword(token, newPassword);

/**
 * Send a magic sign-in link.
 *
 * @param email - Email address that should receive the link.
 * @returns An Effect that succeeds with true or fails with MobileClientError.
 * @example
 * const sent = sendMagicLink(email);
 */
export const sendMagicLink = (email: string) => client.sendMagicLink(email);

/**
 * Verify a magic-link token and sign in.
 *
 * @param token - Magic-link token from the email.
 * @returns An Effect that succeeds with the signed-in user or fails with MobileClientError.
 * @example
 * const user = verifyMagicLink(token);
 */
export const verifyMagicLink = (token: string) => client.verifyMagicLink(token);

/**
 * Send a one-time SMS sign-in code.
 *
 * @param phone - Phone number in E.164 format.
 * @returns An Effect that succeeds with true or fails with MobileClientError.
 * @example
 * const sent = sendSmsCode(phone);
 */
export const sendSmsCode = (phone: string) => client.sendSmsCode(phone);

/**
 * Verify a one-time SMS code and sign in.
 *
 * @param phone - Phone number the code was sent to.
 * @param code - Verification code entered by the user.
 * @returns An Effect that succeeds with the signed-in user or fails with MobileClientError.
 * @example
 * const user = verifySmsCode(phone, code);
 */
export const verifySmsCode = (phone: string, code: string) => client.verifySmsCode(phone, code);
