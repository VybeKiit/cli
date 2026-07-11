import {
  type AccessGate,
  type AccessGateError,
  createRestAccessGate,
  type GithubGateConfig,
} from '@vybekiit/core';
import type { Effect } from 'effect';

/**
 * "The gate" invites paid buyers to the private mirror repos and removes them on refund.
 *
 * Thin re-export over {@link createRestAccessGate} so existing landing imports keep working
 * while AccessGate is the SSOT (grant/revoke).
 *
 * @remarks Server-only: the gate token must never reach the browser.
 */

export type { AccessGateError as GithubGateError };

/**
 * Invite a buyer to every configured mirror repo.
 *
 * @param config - GitHub gate configuration.
 * @param username - Buyer GitHub username.
 * @returns Effect that succeeds when all mirror invites succeed.
 * @example
 * const result = inviteToRepo(config, 'octocat');
 */
const inviteToRepo = (
  config: GithubGateConfig,
  username: string,
): Effect.Effect<true, AccessGateError> => createRestAccessGate(config).grant(username);

/**
 * Revoke buyer access from every configured mirror repo.
 *
 * @param config - GitHub gate configuration.
 * @param username - Buyer GitHub username.
 * @returns Effect that succeeds when all mirror removals succeed.
 * @example
 * const result = removeFromRepo(config, 'octocat');
 */
const removeFromRepo = (
  config: GithubGateConfig,
  username: string,
): Effect.Effect<true, AccessGateError> => createRestAccessGate(config).revoke(username);

/**
 * Build the REST AccessGate for the landing store.
 *
 * @param config - GitHub gate configuration.
 * @returns AccessGate adapter.
 * @example
 * const gate = createLandingAccessGate(config);
 */
const createLandingAccessGate = (config: GithubGateConfig): AccessGate =>
  createRestAccessGate(config);

export { createLandingAccessGate, inviteToRepo, removeFromRepo };
