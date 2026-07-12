import { AuthUserSchema } from '@vybekiit/auth/user';
import { defineRoute, type RouteContract } from '@vybekiit/core/http';
import { Schema } from 'effect';
import {
  EmailCodeBodySchema,
  EmailOnlyBodySchema,
  PhoneCodeBodySchema,
  PhoneOnlyBodySchema,
  ResetPasswordBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  TokenOnlyBodySchema,
} from './schemas';

/** Acknowledgement body returned by send-only auth routes (`{ ok: true }`). */
export const AuthAckSchema = Schema.Struct({ ok: Schema.Literal(true) });

/**
 * The auth HTTP contract (ADR-0043): every generated `/api/auth/*` route with the
 * Schemas for its request body and success response. The OpenAPI document and the
 * typed client derive from this list, and the endpoint contract test decodes live
 * responses against these response Schemas (ADR-0042 §5), so the contract cannot
 * drift from the running server. Paths are the mounted paths (router base
 * `/api/auth`, ADR-0016); operation ids mirror the {@link AuthProvider} methods.
 */
export const AUTH_ROUTES: readonly RouteContract[] = [
  defineRoute({
    operationId: 'auth.signUp',
    method: 'POST',
    path: '/api/auth/signup',
    summary: 'Create an account with email and password.',
    successStatus: 201,
    request: SignUpBodySchema,
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.signIn',
    method: 'POST',
    path: '/api/auth/signin',
    summary: 'Sign in with email and password.',
    request: SignInBodySchema,
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.signOut',
    method: 'POST',
    path: '/api/auth/signout',
    summary: 'Clear the current session.',
    response: AuthAckSchema,
  }),
  defineRoute({
    operationId: 'auth.me',
    method: 'GET',
    path: '/api/auth/me',
    summary: 'Return the currently signed-in user.',
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.sendEmailCode',
    method: 'POST',
    path: '/api/auth/send-code',
    summary: 'Send a one-time email sign-in code.',
    request: EmailOnlyBodySchema,
    response: AuthAckSchema,
  }),
  defineRoute({
    operationId: 'auth.verifyEmailCode',
    method: 'POST',
    path: '/api/auth/verify',
    summary: 'Verify an email one-time code and sign in.',
    request: EmailCodeBodySchema,
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.requestPasswordReset',
    method: 'POST',
    path: '/api/auth/forgot-password',
    summary: 'Send a password-reset link or code.',
    request: EmailOnlyBodySchema,
    response: AuthAckSchema,
  }),
  defineRoute({
    operationId: 'auth.resetPassword',
    method: 'POST',
    path: '/api/auth/reset-password',
    summary: 'Complete a password reset and sign in.',
    request: ResetPasswordBodySchema,
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.sendMagicLink',
    method: 'POST',
    path: '/api/auth/magic-link',
    summary: 'Send a magic sign-in link.',
    request: EmailOnlyBodySchema,
    response: AuthAckSchema,
  }),
  defineRoute({
    operationId: 'auth.verifyMagicLink',
    method: 'POST',
    path: '/api/auth/magic-link/verify',
    summary: 'Verify a magic-link token and sign in.',
    request: TokenOnlyBodySchema,
    response: AuthUserSchema,
  }),
  defineRoute({
    operationId: 'auth.sendSmsCode',
    method: 'POST',
    path: '/api/auth/send-sms-code',
    summary: 'Send a one-time SMS sign-in code.',
    request: PhoneOnlyBodySchema,
    response: AuthAckSchema,
  }),
  defineRoute({
    operationId: 'auth.verifySmsCode',
    method: 'POST',
    path: '/api/auth/verify-sms-code',
    summary: 'Verify an SMS one-time code and sign in.',
    request: PhoneCodeBodySchema,
    response: AuthUserSchema,
  }),
];
