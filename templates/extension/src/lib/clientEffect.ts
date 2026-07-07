import { Data, Effect } from 'effect';

type LegacyClientError = Readonly<{ code: string; message: string }>;

type LegacyClientOutcome<A> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: LegacyClientError };

/** Tagged extension client failure used by auth and billing wire points. */
export class ExtensionClientError extends Data.TaggedError('ExtensionClientError')<{
  readonly code: string;
  readonly message: string;
}> {}

/**
 * Create a tagged extension client error.
 *
 * @param code - Stable machine-readable failure code.
 * @param message - Human-readable failure detail for the UI.
 * @returns A tagged extension client error.
 * @example
 * const error = clientError('invalid_input', 'Pick a plan first.');
 */
export const clientError = (code: string, message: string): ExtensionClientError =>
  new ExtensionClientError({ code, message });

/**
 * Adapt a legacy HTTP outcome into the extension Effect seam.
 *
 * @param promise - Promise returned by the shared HTTP bridge.
 * @returns An Effect that succeeds with the payload or fails with ExtensionClientError.
 * @example
 * const user = legacyOutcomeToEffect(client.signInWithPassword(email, password));
 */
export const legacyOutcomeToEffect = <A>(
  promise: Promise<LegacyClientOutcome<A>>,
): Effect.Effect<A, ExtensionClientError> =>
  Effect.tryPromise({
    try: () => promise,
    catch: (caught) =>
      clientError(
        'network_error',
        caught instanceof Error ? caught.message : 'Network request failed.',
      ),
  }).pipe(
    Effect.flatMap((outcome) => {
      if (outcome.ok) {
        return Effect.succeed(outcome.value);
      }

      return Effect.fail(clientError(outcome.error.code, outcome.error.message));
    }),
  );
