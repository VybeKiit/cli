import { Cause, Effect, Exit, Option } from 'effect';
import { badInput, serverError, unauthorized, upstreamFailed } from './builders';
import type { HttpResponse } from './response';

/**
 * Map a domain failure message to an HTTP response builder.
 * Concerns pass a small table keyed by stable error codes.
 */
export type HttpFailurePolicy<E extends { readonly code: string; readonly message: string }> = {
  /** Default when the code is absent from {@link byCode}. */
  readonly defaultOutcome: 'bad_input' | 'unauthorized' | 'upstream_failed' | 'server_error';
  /** Per-code outcome overrides. */
  readonly byCode?: Readonly<
    Partial<Record<string, 'bad_input' | 'unauthorized' | 'upstream_failed' | 'server_error'>>
  >;
  /**
   * Codes treated as defects (500) rather than expected rejections.
   * Example: `auth_config_invalid`.
   */
  readonly defectCodes?: ReadonlySet<string>;
};

const outcomeResponse = (
  outcome: 'bad_input' | 'unauthorized' | 'upstream_failed' | 'server_error',
  message: string,
): HttpResponse => {
  switch (outcome) {
    case 'bad_input':
      return badInput(message);
    case 'unauthorized':
      return unauthorized(message);
    case 'upstream_failed':
      return upstreamFailed(message);
    case 'server_error':
      return serverError(message);
  }
};

/**
 * Options for {@link runEffectHttp}.
 *
 * @typeParam A - Success value of the Effect program.
 * @typeParam E - Tagged error with `code` + `message`.
 * @typeParam B - HTTP success body type.
 */
export type RunEffectHttpOptions<
  A,
  E extends { readonly code: string; readonly message: string },
  B,
> = {
  /** Effect program to run at the HTTP composition root. */
  readonly program: Effect.Effect<A, E>;
  /** Maps a successful program value to an HTTP response. */
  readonly onSuccess: (value: A) => HttpResponse<B> | Promise<HttpResponse<B>>;
  /** Policy from tagged error codes to HTTP outcomes. */
  readonly failurePolicy: HttpFailurePolicy<E>;
  /** Optional hook for expected (4xx) tagged rejections. */
  readonly onRejection?: (failure: E) => void;
  /** Optional hook for defects / 500 paths. */
  readonly onDefect?: (error: unknown) => void;
  /** Message used when a defect has no tagged failure. */
  readonly defectMessage?: string;
};

/**
 * Run an Effect once at the HTTP edge and map Exit to {@link HttpResponse}.
 *
 * Deep composition root for ADR-0023: handlers declare domain programs and
 * outcome policy; they no longer re-open Exit ladders.
 *
 * Steps:
 * 1. `runPromiseExit` the program.
 * 2. Success → `onSuccess` (may persist session, etc.).
 * 3. Failure with a non-defect tagged error → policy map → 4xx/502 + `onRejection`.
 * 4. Defect or defect-coded failure → `onDefect` + 500.
 *
 * @typeParam A - Program success type.
 * @typeParam E - Tagged error type.
 * @typeParam B - Response body type.
 * @param options - Program, success mapper, and failure policy.
 * @returns HTTP response for the route adapter.
 * @example
 * const response = await runEffectHttp({
 *   program: auth.signInWithPassword(email, password),
 *   onSuccess: (session) => ok(session.user),
 *   failurePolicy: { defaultOutcome: 'unauthorized' },
 * });
 */
export const runEffectHttp = async <
  A,
  E extends { readonly code: string; readonly message: string },
  B,
>(
  options: RunEffectHttpOptions<A, E, B>,
): Promise<HttpResponse<B> | HttpResponse> => {
  const {
    program,
    onSuccess,
    failurePolicy,
    onRejection,
    onDefect,
    defectMessage = 'Something went wrong. Try again.',
  } = options;

  try {
    const exit = await Effect.runPromiseExit(program);
    if (Exit.isSuccess(exit)) {
      return await onSuccess(exit.value);
    }

    const failure = Option.getOrNull(Cause.failureOption(exit.cause)) as E | null;
    if (failure === null || failurePolicy.defectCodes?.has(failure.code) === true) {
      const defect = failure === null ? Cause.squash(exit.cause) : new Error(failure.message);
      onDefect?.(defect);
      return serverError(defectMessage);
    }

    onRejection?.(failure);
    const outcome = failurePolicy.byCode?.[failure.code] ?? failurePolicy.defaultOutcome;
    return outcomeResponse(outcome, failure.message);
  } catch (error) {
    onDefect?.(error);
    return serverError(defectMessage);
  }
};
