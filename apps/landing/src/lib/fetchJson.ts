import { Data, Effect, Either, Schema } from 'effect';

type FetchJsonErrorCode = 'http_error' | 'network_error';

export class FetchJsonError extends Data.TaggedError('FetchJsonError')<{
  readonly code: FetchJsonErrorCode;
  readonly message: string;
}> {}

const ErrorBodySchema = Schema.Struct({
  error: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
});

type ErrorBody = Schema.Schema.Type<typeof ErrorBodySchema>;

/**
 * Create a typed JSON request error.
 *
 * @param code - Stable JSON request failure code.
 * @param message - Human-readable failure message.
 * @returns A tagged fetch JSON error.
 * @example
 * const error = fetchJsonError('http_error', 'Request failed.');
 */
const fetchJsonError = (code: FetchJsonErrorCode, message: string): FetchJsonError =>
  new FetchJsonError({ code, message });

/**
 * Check whether decoded JSON carries a usable error message.
 *
 * @param body - Decoded error response body.
 * @returns First usable message from the body, or undefined.
 * @example
 * const message = messageFromBody({ error: 'Invalid' });
 */
const messageFromBody = (body: ErrorBody): string | undefined => {
  if (body.error !== undefined) {
    return body.error;
  }

  return body.message;
};

/**
 * Pull a human-readable message from a failed response.
 *
 * @param response - Failed fetch response.
 * @returns Message from JSON body or the HTTP status.
 * @example
 * const message = await readErrorMessage(response);
 */
const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const decoded = Schema.decodeUnknownEither(ErrorBodySchema)(await response.json());
    if (Either.isRight(decoded)) {
      const message = messageFromBody(decoded.right);
      if (message !== undefined) {
        return message;
      }
    }
  } catch {
    return `Request failed (${response.status}).`;
  }

  return `Request failed (${response.status}).`;
};

/**
 * Convert an unknown fetch failure into a readable network message.
 *
 * @param error - Unknown value thrown by fetch.
 * @returns Message for a network failure.
 * @example
 * const message = networkMessage(new Error('offline'));
 */
const networkMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Network request failed.';

/**
 * POST a JSON body to a URL and parse the JSON response as `T`.
 *
 * @typeParam T - Expected JSON shape on success.
 * @param url - API URL to call.
 * @param body - Body serialized as JSON.
 * @returns Effect that succeeds with parsed JSON or fails with a typed request error.
 * @example
 * const checkout = postJson<CheckoutResponse>('/api/checkout', { email: 'you@example.com' });
 */
const postJson = <T>(url: string, body: unknown): Effect.Effect<T, FetchJsonError> =>
  Effect.flatMap(
    Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        }),
      catch: (error) => fetchJsonError('network_error', networkMessage(error)),
    }),
    (response) => {
      if (!response.ok) {
        return Effect.flatMap(
          Effect.promise(() => readErrorMessage(response)),
          (message) => Effect.fail(fetchJsonError('http_error', message)),
        );
      }

      return Effect.promise(() => response.json() as Promise<T>);
    },
  );

export { postJson };
