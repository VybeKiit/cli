import { GITHUB_API_BASE, type GithubGateConfig } from '@vybekiit/core';
import { Data, Effect, Either } from 'effect';

/**
 * "The gate" invites paid buyers to the private mirror repos and removes them on refund.
 *
 * @remarks Server-only: the gate token must never reach the browser.
 */

type GithubGateErrorCode = 'network_error' | 'invite_failed' | 'remove_failed';

export class GithubGateError extends Data.TaggedError('GithubGateError')<{
  readonly code: GithubGateErrorCode;
  readonly message: string;
}> {}

/**
 * Create a typed gate error.
 *
 * @param code - Stable gate failure code.
 * @param message - Human-readable failure detail.
 * @returns A tagged GitHub gate error.
 * @example
 * const error = githubGateError('invite_failed', 'GitHub rejected the invite.');
 */
const githubGateError = (code: GithubGateErrorCode, message: string): GithubGateError =>
  new GithubGateError({ code, message });

/**
 * Build GitHub API headers for the gate token.
 *
 * @param config - GitHub gate configuration.
 * @returns Headers accepted by the GitHub REST API.
 * @example
 * const headers = gateHeaders(config);
 */
const gateHeaders = (config: GithubGateConfig): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${config.GITHUB_GATE_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
  // GitHub rejects API requests with no User-Agent (403). The Cloudflare Workers `fetch`
  // does not set one, so the gate must send it explicitly or every invite fails in prod.
  'User-Agent': 'vybekiit-gate',
});

/**
 * Build the GitHub collaborator endpoint for one repo/user pair.
 *
 * @param config - GitHub gate configuration.
 * @param repo - Mirror repo name.
 * @param username - Buyer GitHub username.
 * @returns GitHub collaborator API URL.
 * @example
 * const url = collaboratorUrl(config, 'web', 'octocat');
 */
const collaboratorUrl = (config: GithubGateConfig, repo: string, username: string): string =>
  `${GITHUB_API_BASE}/repos/${config.GITHUB_GATE_ORG}/${repo}/collaborators/${username}`;

/**
 * Convert an unknown fetch failure into a readable network detail.
 *
 * @param error - Unknown value thrown by fetch.
 * @returns A safe error message for the gate response.
 * @example
 * const message = networkDetail(new Error('timeout'));
 */
const networkDetail = (error: unknown): string =>
  error instanceof Error ? error.message : 'unknown network error';

/**
 * Send a GitHub collaborator request.
 *
 * @param config - GitHub gate configuration.
 * @param repo - Mirror repo name.
 * @param username - Buyer GitHub username.
 * @param init - Fetch options for the GitHub request.
 * @returns GitHub response wrapped in Effect.
 * @example
 * const response = requestGithubGate(config, 'web', 'octocat', { method: 'PUT' });
 */
const requestGithubGate = (
  config: GithubGateConfig,
  repo: string,
  username: string,
  init: RequestInit,
): Effect.Effect<Response, GithubGateError> =>
  Effect.tryPromise({
    try: () => fetch(collaboratorUrl(config, repo, username), init),
    catch: (error) =>
      githubGateError('network_error', `Could not reach GitHub: ${networkDetail(error)}`),
  });

/**
 * Invite a buyer to one mirror repo.
 *
 * @param config - GitHub gate configuration.
 * @param repo - Mirror repo name.
 * @param username - Buyer GitHub username.
 * @returns Effect that succeeds when GitHub accepts or already has the collaborator.
 * @example
 * const invite = inviteOneRepo(config, 'web', 'octocat');
 */
const inviteOneRepo = (
  config: GithubGateConfig,
  repo: string,
  username: string,
): Effect.Effect<true, GithubGateError> =>
  Effect.flatMap(
    requestGithubGate(config, repo, username, {
      method: 'PUT',
      headers: gateHeaders(config),
      body: JSON.stringify({ permission: 'pull' }),
    }),
    (response) => {
      if (response.status === 201 || response.status === 204) {
        return Effect.succeed(true as const);
      }

      return Effect.fail(
        githubGateError(
          'invite_failed',
          `GitHub returned ${response.status} inviting ${username} to ${repo}.`,
        ),
      );
    },
  );

/**
 * Remove a buyer from one mirror repo.
 *
 * @param config - GitHub gate configuration.
 * @param repo - Mirror repo name.
 * @param username - Buyer GitHub username.
 * @returns Effect that succeeds when GitHub removes the collaborator.
 * @example
 * const removal = removeOneRepo(config, 'web', 'octocat');
 */
const removeOneRepo = (
  config: GithubGateConfig,
  repo: string,
  username: string,
): Effect.Effect<true, GithubGateError> =>
  Effect.flatMap(
    requestGithubGate(config, repo, username, {
      method: 'DELETE',
      headers: gateHeaders(config),
    }),
    (response) => {
      if (response.status === 204) {
        return Effect.succeed(true as const);
      }

      return Effect.fail(
        githubGateError(
          'remove_failed',
          `GitHub returned ${response.status} removing ${username} from ${repo}.`,
        ),
      );
    },
  );

/**
 * Aggregate repo failures into one typed gate error.
 *
 * @param code - Aggregate failure code.
 * @param failures - Per-repo failure messages.
 * @returns A single gate error for the route response.
 * @example
 * const error = aggregateGateError('invite_failed', ['repo failed']);
 */
const aggregateGateError = (
  code: Extract<GithubGateErrorCode, 'invite_failed' | 'remove_failed'>,
  failures: readonly string[],
): GithubGateError => githubGateError(code, failures.join('; '));

/**
 * Run one gate action against every configured mirror repo.
 *
 * @param config - GitHub gate configuration.
 * @param username - Buyer GitHub username.
 * @param action - Per-repo Effect action.
 * @param failureCode - Aggregate failure code.
 * @returns Effect that succeeds only when every mirror succeeds.
 * @example
 * const invite = runForEachMirror(config, 'octocat', inviteOneRepo, 'invite_failed');
 */
const runForEachMirror = (
  config: GithubGateConfig,
  username: string,
  action: (
    config: GithubGateConfig,
    repo: string,
    username: string,
  ) => Effect.Effect<true, GithubGateError>,
  failureCode: Extract<GithubGateErrorCode, 'invite_failed' | 'remove_failed'>,
): Effect.Effect<true, GithubGateError> =>
  Effect.flatMap(
    Effect.all(
      config.GITHUB_GATE_REPOS.map((repo) => Effect.either(action(config, repo, username))),
      // Invite the mirror repos serially: GitHub's secondary rate limit rejects *concurrent*
      // write requests for one token (403), which would leave a paid buyer un-invited.
      { concurrency: 1 },
    ),
    (results) => {
      const failures = results.filter(Either.isLeft).map((result) => result.left.message);
      if (failures.length > 0) {
        return Effect.fail(aggregateGateError(failureCode, failures));
      }

      return Effect.succeed(true as const);
    },
  );

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
): Effect.Effect<true, GithubGateError> =>
  runForEachMirror(config, username, inviteOneRepo, 'invite_failed');

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
): Effect.Effect<true, GithubGateError> =>
  runForEachMirror(config, username, removeOneRepo, 'remove_failed');

export { inviteToRepo, removeFromRepo };
