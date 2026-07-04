import { fail, GITHUB_API_BASE, type GithubGateConfig, ok, type Result } from '@vybekiit/core';

/**
 * "The gate" — VybeKiit's single paid wall (see CONTEXT.md → Distribution).
 *
 * A paid Lemon Squeezy order invites the buyer's GitHub account to the private
 * template mirror repos; a refund removes access from each. Server-only — the gate
 * token must never reach the browser.
 */

function gateHeaders(config: GithubGateConfig): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.GITHUB_GATE_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function collaboratorUrl(config: GithubGateConfig, repo: string, username: string): string {
  return `${GITHUB_API_BASE}/repos/${config.GITHUB_GATE_ORG}/${repo}/collaborators/${username}`;
}

async function inviteOneRepo(
  config: GithubGateConfig,
  repo: string,
  username: string,
): Promise<Result<true>> {
  let response: Response;
  try {
    response = await fetch(collaboratorUrl(config, repo, username), {
      method: 'PUT',
      headers: gateHeaders(config),
      body: JSON.stringify({ permission: 'pull' }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach GitHub: ${detail}`);
  }

  if (response.status === 201 || response.status === 204) {
    return ok(true);
  }
  return fail(
    'invite_failed',
    `GitHub returned ${response.status} inviting ${username} to ${repo}.`,
  );
}

async function removeOneRepo(
  config: GithubGateConfig,
  repo: string,
  username: string,
): Promise<Result<true>> {
  let response: Response;
  try {
    response = await fetch(collaboratorUrl(config, repo, username), {
      method: 'DELETE',
      headers: gateHeaders(config),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach GitHub: ${detail}`);
  }

  if (response.status === 204) {
    return ok(true);
  }
  return fail(
    'remove_failed',
    `GitHub returned ${response.status} removing ${username} from ${repo}.`,
  );
}

/** Invite a buyer to every configured mirror repo (idempotent per repo). */
export async function inviteToRepo(
  config: GithubGateConfig,
  username: string,
): Promise<Result<true>> {
  const failures: string[] = [];
  for (const repo of config.GITHUB_GATE_REPOS) {
    const result = await inviteOneRepo(config, repo, username);
    if (!result.ok) {
      failures.push(result.error.message);
    }
  }
  if (failures.length > 0) {
    return fail('invite_failed', failures.join('; '));
  }
  return ok(true);
}

/** Revoke access on refund from every configured mirror repo. */
export async function removeFromRepo(
  config: GithubGateConfig,
  username: string,
): Promise<Result<true>> {
  const failures: string[] = [];
  for (const repo of config.GITHUB_GATE_REPOS) {
    const result = await removeOneRepo(config, repo, username);
    if (!result.ok) {
      failures.push(result.error.message);
    }
  }
  if (failures.length > 0) {
    return fail('remove_failed', failures.join('; '));
  }
  return ok(true);
}
