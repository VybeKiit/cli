import { Data, Effect, Either } from 'effect';
import type { GithubGateConfig } from './config';
import { GITHUB_API_BASE } from './constants';

/**
 * Shared delivery-repo defaults for the access gate (ADR-0033 / ADR-0038).
 * Landing grant and CLI probe must share this list so “paid” means one thing.
 */
export const DEFAULT_GATE_REPOS = ['kit', 'web', 'mobile', 'extension'] as const;

/** Default GitHub org that owns delivery mirrors. */
export const DEFAULT_GATE_ORG = 'VybeKiit';

/** Stable failure codes for AccessGate operations. */
export type AccessGateErrorCode =
  | 'network_error'
  | 'invite_failed'
  | 'remove_failed'
  | 'probe_failed';

/**
 * Tagged AccessGate failure.
 */
export class AccessGateError extends Data.TaggedError('AccessGateError')<{
  readonly code: AccessGateErrorCode;
  readonly message: string;
}> {}

/**
 * Product paywall interface: grant / revoke / probe paid access to delivery mirrors.
 *
 * Two adapters justify the seam: REST (Workers / landing webhook) and `gh` (CLI doctor).
 */
export type AccessGate = {
  /** Invite username to every configured delivery repo. */
  readonly grant: (username: string) => Effect.Effect<true, AccessGateError>;
  /** Remove username from every configured delivery repo. */
  readonly revoke: (username: string) => Effect.Effect<true, AccessGateError>;
  /**
   * Probe whether the current identity has paid access.
   * REST adapter may not implement probe (Workers use token, not buyer identity).
   */
  readonly hasAccess?: () => Effect.Effect<boolean, AccessGateError>;
};

/**
 * Build a typed AccessGate error.
 *
 * @param code - Stable failure code.
 * @param message - Human-readable detail.
 * @returns Tagged AccessGateError.
 * @example
 * const error = accessGateError('invite_failed', 'GitHub rejected the invite.');
 */
export const accessGateError = (code: AccessGateErrorCode, message: string): AccessGateError =>
  new AccessGateError({ code, message });

/**
 * Normalize a repo CSV or array into a non-empty list, falling back to defaults.
 *
 * @param repos - Configured repo list or undefined.
 * @returns Repo names for grant/revoke/probe.
 * @example
 * const repos = normalizeGateRepos(['kit', 'web']);
 */
export const normalizeGateRepos = (repos: readonly string[] | undefined): readonly string[] => {
  if (repos !== undefined && repos.length > 0) {
    return repos;
  }
  return DEFAULT_GATE_REPOS;
};

/**
 * Parse CLI/env overrides used by the doctor probe into org + repos.
 * Accepts both `GITHUB_GATE_*` (landing) and `VYBEKIIT_GATE_*` (CLI) names.
 *
 * @param env - Environment map.
 * @returns Org name and repo list for AccessGate.
 * @example
 * const { org, repos } = readGateIdentity(process.env);
 */
export const readGateIdentity = (
  env: Record<string, string | undefined>,
): { readonly org: string; readonly repos: readonly string[] } => {
  const org = env.GITHUB_GATE_ORG?.trim() || env.VYBEKIIT_GATE_ORG?.trim() || DEFAULT_GATE_ORG;
  const raw =
    env.GITHUB_GATE_REPOS?.trim() ||
    env.VYBEKIIT_GATE_REPOS?.trim() ||
    DEFAULT_GATE_REPOS.join(',');
  const repos = raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  return { org, repos: normalizeGateRepos(repos) };
};

const gateHeaders = (token: string): Record<string, string> => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'vybekiit-gate',
});

const collaboratorUrl = (org: string, repo: string, username: string): string =>
  `${GITHUB_API_BASE}/repos/${org}/${repo}/collaborators/${username}`;

const networkDetail = (error: unknown): string =>
  error instanceof Error ? error.message : 'unknown network error';

/**
 * Create a REST AccessGate adapter (landing webhook / Workers).
 *
 * @param config - GitHub gate config with token + org + repos.
 * @returns AccessGate with grant/revoke (no hasAccess — buyer identity is not the token).
 * @example
 * const gate = createRestAccessGate(parseEnv(githubGateConfigSchema));
 */
export const createRestAccessGate = (config: GithubGateConfig): AccessGate => {
  const org = config.GITHUB_GATE_ORG;
  const repos = normalizeGateRepos(config.GITHUB_GATE_REPOS);
  const headers = gateHeaders(config.GITHUB_GATE_TOKEN);

  const request = (
    repo: string,
    username: string,
    init: RequestInit,
  ): Effect.Effect<Response, AccessGateError> =>
    Effect.tryPromise({
      try: () => fetch(collaboratorUrl(org, repo, username), init),
      catch: (error) =>
        accessGateError('network_error', `Could not reach GitHub: ${networkDetail(error)}`),
    });

  const forEachRepo = (
    username: string,
    action: (repo: string) => Effect.Effect<true, AccessGateError>,
    failureCode: Extract<AccessGateErrorCode, 'invite_failed' | 'remove_failed'>,
  ): Effect.Effect<true, AccessGateError> =>
    // Multi-mirror flow:
    // 1. Map each repo to invite/remove Effect (Either-wrapped).
    // 2. Run serially (concurrency: 1) — concurrent writes hit GitHub secondary rate limits.
    // 3. Aggregate left-side failures into one gate error; else succeed.
    Effect.flatMap(
      Effect.all(
        repos.map((repo) => Effect.either(action(repo))),
        { concurrency: 1 },
      ),
      (results) => {
        const failures = results.filter(Either.isLeft).map((result) => result.left.message);
        if (failures.length > 0) {
          return Effect.fail(accessGateError(failureCode, failures.join('; ')));
        }
        return Effect.succeed(true as const);
      },
    );

  return {
    grant: (username) =>
      forEachRepo(
        username,
        (repo) =>
          Effect.flatMap(
            request(repo, username, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ permission: 'pull' }),
            }),
            (response) => {
              if (response.status === 201 || response.status === 204) {
                return Effect.succeed(true as const);
              }
              return Effect.fail(
                accessGateError(
                  'invite_failed',
                  `GitHub returned ${response.status} inviting ${username} to ${repo}.`,
                ),
              );
            },
          ),
        'invite_failed',
      ),
    revoke: (username) =>
      forEachRepo(
        username,
        (repo) =>
          Effect.flatMap(request(repo, username, { method: 'DELETE', headers }), (response) => {
            if (response.status === 204) {
              return Effect.succeed(true as const);
            }
            return Effect.fail(
              accessGateError(
                'remove_failed',
                `GitHub returned ${response.status} removing ${username} from ${repo}.`,
              ),
            );
          }),
        'remove_failed',
      ),
  };
};
