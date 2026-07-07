import { Effect } from 'effect';
import { DeployError } from './types';

/**
 * Build a deploy package tagged error.
 *
 * @param code - Stable machine-readable deploy error code.
 * @param message - Developer-facing error detail.
 * @returns A tagged deploy error.
 * @example
 * const error = deployError('deploy_failed', 'Cloudflare deploy failed.');
 */
export const deployError = (code: string, message: string): DeployError =>
  new DeployError({ code, message });

/**
 * Convert an unknown caught value into a useful message.
 *
 * @param caught - Unknown value caught by an Effect boundary.
 * @param fallback - Message used when the caught value is not an Error.
 * @returns The caught error message or fallback.
 * @example
 * const detail = caughtMessage(caught, 'unknown deploy error');
 */
export const caughtMessage = (caught: unknown, fallback: string): string =>
  caught instanceof Error ? caught.message : fallback;

/**
 * Fail an Effect with a tagged deploy error.
 *
 * @param code - Stable machine-readable deploy error code.
 * @param message - Developer-facing error detail.
 * @returns An Effect that fails with DeployError.
 * @example
 * return failDeploy('no_runner', 'Deploy runner is not configured.');
 */
export const failDeploy = <A = never>(
  code: string,
  message: string,
): Effect.Effect<A, DeployError> => Effect.fail(deployError(code, message));

/**
 * Wrap deploy IO in an Effect with a tagged error.
 *
 * @param code - Error code used when the action rejects.
 * @param run - Async operation to execute.
 * @param fallback - Message used when the caught value is not an Error.
 * @returns An Effect containing the async result or a DeployError.
 * @example
 * const response = await Effect.runPromise(tryDeploy('network_error', () => fetch(url), 'fetch failed'));
 */
export const tryDeploy = <A>(
  code: string,
  run: () => Promise<A>,
  fallback: string,
): Effect.Effect<A, DeployError> =>
  Effect.tryPromise({
    try: run,
    catch: (caught) => deployError(code, caughtMessage(caught, fallback)),
  });
