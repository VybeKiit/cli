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
export interface VybeKiitError {
  readonly code: string;
  readonly message: string;
}

/** Wrap a success value in a {@link Result}. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Wrap a failure in a {@link Result}. */
export function err<E = VybeKiitError>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Build a {@link VybeKiitError}-shaped failure from a stable code + message. */
export function fail(code: string, message: string): Result<never, VybeKiitError> {
  return err({ code, message });
}
