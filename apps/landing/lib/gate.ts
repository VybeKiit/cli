import { GITHUB_API_BASE, type GithubGateConfig, type Result, fail, ok } from '@vybekiit/core';

/**
 * "The gate" — VybeKiit's single paid wall (see CONTEXT.md → Distribution).
 *
 * A paid Lemon Squeezy order invites the buyer's GitHub account to the private
 * product repo; a refund removes it. This is *our* store's logic, not part of the
 * buyer template (a buyer fulfills orders for their own product instead). Server-
 * only — the gate token must never reach the browser.
 */

function gateHeaders(config: GithubGateConfig): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.GITHUB_GATE_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function collaboratorUrl(config: GithubGateConfig, username: string): string {
  return `${GITHUB_API_BASE}/repos/${config.GITHUB_GATE_ORG}/${config.GITHUB_GATE_REPO}/collaborators/${username}`;
}

/** Invite a buyer to the private repo (idempotent — re-inviting is harmless). */
export async function inviteToRepo(
  config: GithubGateConfig,
  username: string,
): Promise<Result<true>> {
  let response: Response;
  try {
    response = await fetch(collaboratorUrl(config, username), {
      method: 'PUT',
      headers: gateHeaders(config),
      body: JSON.stringify({ permission: 'pull' }),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach GitHub: ${detail}`);
  }

  // 201 = invitation created, 204 = already a collaborator.
  if (response.status === 201 || response.status === 204) return ok(true);
  return fail('invite_failed', `GitHub returned ${response.status} inviting ${username}.`);
}

/** Revoke access on refund. */
export async function removeFromRepo(
  config: GithubGateConfig,
  username: string,
): Promise<Result<true>> {
  let response: Response;
  try {
    response = await fetch(collaboratorUrl(config, username), {
      method: 'DELETE',
      headers: gateHeaders(config),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach GitHub: ${detail}`);
  }

  if (response.status === 204) return ok(true);
  return fail('remove_failed', `GitHub returned ${response.status} removing ${username}.`);
}
