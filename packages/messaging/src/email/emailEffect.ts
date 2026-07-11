import { Effect } from 'effect';

import { EmailError } from './types';

/**
 * Create a typed email failure.
 *
 * @param input - Error code and message exposed through the Effect error channel.
 * @returns EmailError with the shared `EmailError` tag.
 * @example
 * const error = emailError({ code: 'EMAIL_SEND_FAILED', message: 'Resend returned 401.' });
 */
export const emailError = (input: {
  readonly code:
    | 'EMAIL_CONFIG_INVALID'
    | 'EMAIL_PROVIDER_UNSUPPORTED'
    | 'EMAIL_SEND_FAILED'
    | 'EMAIL_INVALID_RESPONSE';
  readonly message: string;
}): EmailError => new EmailError(input);

/**
 * Convert an unknown caught value into a readable message.
 *
 * @param caught - Unknown value from an Effect catch handler.
 * @returns Error message for `Error` values, otherwise the stringified value.
 * @example
 * const message = caughtMessage(caught);
 */
export const caughtMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

/**
 * Fail an Effect with a typed email error.
 *
 * @param input - Error code and message exposed through the Effect error channel.
 * @returns A failing Effect carrying EmailError.
 * @example
 * const effect = failEmail({ code: 'EMAIL_INVALID_RESPONSE', message: 'Missing message id.' });
 */
export const failEmail = (
  input: Parameters<typeof emailError>[0],
): Effect.Effect<never, EmailError> => Effect.fail(emailError(input));

/**
 * Wrap synchronous email code in a typed Effect boundary.
 *
 * @param evaluate - Synchronous operation to run.
 * @param onError - Mapper from unknown caught value to EmailError.
 * @returns An Effect that succeeds with the operation result or fails with EmailError.
 * @example
 * const config = await Effect.runPromise(tryEmail(() => parseEnv(schema, source), toEmailError));
 */
export const tryEmail = <A>(
  evaluate: () => A,
  onError: (caught: unknown) => EmailError,
): Effect.Effect<A, EmailError> =>
  Effect.try({
    try: evaluate,
    catch: onError,
  });
