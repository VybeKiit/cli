import { spawnSync } from 'node:child_process';

/**
 * Thin wrappers over the Cloudflare `wrangler` CLI (ensured via `doctor --ensure wrangler`).
 *
 * Wrangler is the CLI-first path for the parts it can do headlessly — reading the signed-in
 * account id and verifying a token. It cannot mint an arbitrary *scoped* API token, so the
 * actual token creation still falls through to the browser flow (see `dashboard/createApiToken`).
 */

/**
 * Read the account id from `wrangler whoami` output. Returns null if not signed in.
 *
 * @returns Computed value for downstream automation.
 * @example
 * const result = readAccountIdFromWrangler();
 */
export const readAccountIdFromWrangler = (): string | null => {
  const result = spawnSync('wrangler', ['whoami'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';
  const out = `${stdout}${stderr}`;
  // whoami prints a table with the 32-hex account id somewhere in it.
  const match = out.match(/[0-9a-f]{32}/i);
  return match === null ? null : match[0];
};

/**
 * True when `wrangler whoami` reports a signed-in user.
 *
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = isWranglerAuthenticated();
 */
export const isWranglerAuthenticated = (): boolean => {
  const result = spawnSync('wrangler', ['whoami'], { encoding: 'utf8' });
  return result.status === 0;
};
