/**
 * A discriminated-union result type used across VybeKiit's headless packages.
 *
 * Why: every package boundary (payments, auth, db) can fail for expected reasons
 * (bad webhook signature, unknown user, network error). Returning `Result` instead
 * of throwing for those expected paths lets callers — and the buyer's agent —
 * branch on `ok` explicitly and translate failures into plain language, rather
 * than wrapping everything in try/catch. Unexpected/programmer errors still throw.
 *
 * @typeParam T - the success value
 * @typeParam E - the error value (defaults to a `VybeKiitError`)
 */
export type Result<T, E = VybeKiitError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Structured error carried by a failed {@link Result}.
 *
 * `code` is a stable, machine-readable discriminant (skills branch on it to pick
 * the right plain-language message); `message` is the developer-facing detail.
 */
export type VybeKiitError = {
  readonly code: string;
  readonly message: string;
};

/**
 * Wrap a success value in a {@link Result}.
 *
 * @param value - Success payload to expose on the `value` branch.
 * @returns A successful Result.
 * @example
 * const result = ok({ id: 'order_1' });
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Wrap a failure payload in a {@link Result}.
 *
 * @param error - Failure payload to expose on the `error` branch.
 * @returns A failed Result.
 * @example
 * const result = err({ code: 'not_found', message: 'Order not found.' });
 */
export const err = <E = VybeKiitError>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Build a {@link VybeKiitError}-shaped failure from a stable code and message.
 *
 * @param code - Machine-readable code agents can branch on.
 * @param message - Developer-facing failure detail.
 * @returns A failed Result with the standard VybeKiit error shape.
 * @example
 * const result = fail('unauthorized', 'Sign in first.');
 */
export const fail = (code: string, message: string): Result<never, VybeKiitError> =>
  err({ code, message });
