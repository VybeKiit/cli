import { Effect } from 'effect';
import { AuthError } from './types';
import type { AuthUser } from './user';

/** Server routes buyer-facing auth clients call; one place so they never drift. */
export const AUTH_CLIENT_ROUTES = {
  signIn: '/api/auth/signin',
  signUp: '/api/auth/signup',
  sendCode: '/api/auth/send-code',
  verify: '/api/auth/verify',
  signOut: '/api/auth/signout',
} as const;

export type AuthClientPostJson<E> = <T>(url: string, body: unknown) => Effect.Effect<T, E>;

/** Maps auth client validation failures into the caller's Effect error type. */
export type AuthClientInputError<E> = (code: string, message: string) => E;

/** Optional auth client seams supplied by template composition roots. */
export type AuthClientOptions<E> = {
  readonly inputError?: AuthClientInputError<E>;
};

/** Browser-safe auth client shared by template wire points. */
export type AuthClient<E = AuthError> = {
  readonly signInWithPassword: (email: string, password: string) => Effect.Effect<AuthUser, E>;
  readonly signUpWithPassword: (email: string, password: string) => Effect.Effect<AuthUser, E>;
  readonly sendEmailCode: (email: string) => Effect.Effect<true, E>;
  readonly verifyEmailCode: (email: string, code: string) => Effect.Effect<AuthUser, E>;
  readonly signOut: () => Effect.Effect<true, E>;
};

const defaultInputError = (code: string, message: string): AuthError =>
  new AuthError({ code, message });

const resolveInputError = <E>(
  options: AuthClientOptions<E> | undefined,
): AuthClientInputError<E> => {
  if (options?.inputError !== undefined) {
    return options.inputError;
  }

  return defaultInputError as AuthClientInputError<E>;
};

const failInput = <E>(
  createInputError: AuthClientInputError<E>,
  message: string,
): Effect.Effect<never, E> => Effect.fail(createInputError('invalid_input', message));

/**
 * Create the template-facing auth client.
 *
 * @param postJson - Effect JSON POST helper supplied by the template runtime.
 * @param options - Optional error factory for client-side validation failures.
 * @returns A browser-safe Effect auth client backed by the shared auth API routes.
 * @example
 * const client = createAuthClient(postJson, { inputError: clientError });
 */
export const createAuthClient = <E = AuthError>(
  postJson: AuthClientPostJson<E>,
  options?: AuthClientOptions<E> | undefined,
): AuthClient<E> => {
  const inputError = resolveInputError(options);

  return {
    signInWithPassword: (email, password) => {
      if (!(email && password)) {
        return failInput(inputError, 'auth.errors.enterEmailAndPassword');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.signIn, { email, password });
    },

    signUpWithPassword: (email, password) => {
      if (!(email && password)) {
        return failInput(inputError, 'auth.errors.enterEmailAndPassword');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.signUp, { email, password });
    },

    sendEmailCode: (email) => {
      if (!email) {
        return failInput(inputError, 'auth.errors.enterEmail');
      }
      return postJson<{ readonly ok: true }>(AUTH_CLIENT_ROUTES.sendCode, { email }).pipe(
        Effect.as(true as const),
      );
    },

    verifyEmailCode: (email, code) => {
      if (!(email && code)) {
        return failInput(inputError, 'auth.errors.enterCode');
      }
      return postJson<AuthUser>(AUTH_CLIENT_ROUTES.verify, { email, code });
    },

    signOut: () =>
      postJson<{ readonly ok: true }>(AUTH_CLIENT_ROUTES.signOut, {}).pipe(
        Effect.as(true as const),
      ),
  };
};
