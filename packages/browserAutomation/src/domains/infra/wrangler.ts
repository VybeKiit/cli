import { spawnSync } from 'node:child_process';

/**
 * Thin wrappers over the Cloudflare `wrangler` CLI (ensured via `doctor --ensure wrangler`).
 *
 * Wrangler is the CLI-first path for the parts it can do headlessly — reading the signed-in
 * account id and verifying a token. It cannot mint an arbitrary *scoped* API token, so the
 * actual token creation still falls through to the browser flow (see `dashboard/createApiToken`).
 */

/** Read the account id from `wrangler whoami` output. Returns null if not signed in. */
export function readAccountIdFromWrangler(): string | null {
  const result = spawnSync('wrangler', ['whoami'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  // whoami prints a table with the 32-hex account id somewhere in it.
  return out.match(/[0-9a-f]{32}/i)?.[0] ?? null;
}

/** True when `wrangler whoami` reports a signed-in user. */
export function isWranglerAuthenticated(): boolean {
  const result = spawnSync('wrangler', ['whoami'], { encoding: 'utf8' });
  return result.status === 0;
}
