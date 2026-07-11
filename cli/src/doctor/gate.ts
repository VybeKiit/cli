import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { readGateIdentity } from '@vybekiit/core';

/**
 * The access gate — VybeKiit's paid wall on the CLI (ADR-0033).
 *
 * A paid purchase invites the buyer's GitHub account to the private delivery repos
 * (see apps/landing AccessGate). Every command except help/version/doctor runs this first:
 * if the signed-in GitHub account is neither a member of the org NOR a collaborator on
 * a delivery repo, we print purchase guidance and exit — re-running re-checks, so once
 * access is granted it simply passes. Set VYBEKIIT_SKIP_GATE=1 to bypass in CI/automation.
 *
 * Org/repos SSOT: {@link readGateIdentity} (same defaults as landing grant).
 */

const { org: GATE_ORG, repos: GATE_REPOS } = readGateIdentity(process.env);

/** Where to send an ungated buyer to purchase. Override with VYBEKIIT_SITE_URL. */
const SITE_URL = (() => {
  const value = process.env.VYBEKIIT_SITE_URL;
  if (value !== undefined && value.trim() !== '') {
    return value;
  }
  return 'https://vybekiit.com';
})();

export type GateReason = 'ok' | 'skipped' | 'gh-missing' | 'gh-unauthed' | 'no-access';

export type GateResult = {
  readonly allowed: boolean;
  readonly reason: GateReason;
  readonly org: string;
};

/**
 * Probe a GitHub CLI command.
 *
 * @param args - `gh` arguments.
 * @returns True when the command exits successfully.
 * @example
 * const ok = ghSucceeds(['--version']);
 */
const ghSucceeds = (args: readonly string[]): boolean =>
  spawnSync('gh', [...args], { stdio: 'ignore' }).status === 0;

/** True when the signed-in user is an active member of the gate org. */
const isOrgMember = (): boolean => {
  const result = spawnSync('gh', ['api', `user/memberships/orgs/${GATE_ORG}`, '--jq', '.state'], {
    encoding: 'utf8',
  });
  const stdout = result.stdout === undefined ? '' : result.stdout;
  return result.status === 0 && stdout.trim() === 'active';
};

/** True when the signed-in user can read at least one private delivery repo. */
const hasRepoAccess = (): boolean =>
  GATE_REPOS.some((repo) => ghSucceeds(['api', `repos/${GATE_ORG}/${repo}`]));

/**
 * Decide whether the signed-in GitHub account holds a VybeKiit license.
 *
 * @returns Gate result with allow/deny reason.
 * @example
 * const access = checkAccess();
 */
export const checkAccess = (): GateResult => {
  if (process.env.VYBEKIIT_SKIP_GATE === '1') {
    return { allowed: true, reason: 'skipped', org: GATE_ORG };
  }
  if (!ghSucceeds(['--version'])) {
    return { allowed: false, reason: 'gh-missing', org: GATE_ORG };
  }
  if (!ghSucceeds(['auth', 'status'])) {
    return { allowed: false, reason: 'gh-unauthed', org: GATE_ORG };
  }
  if (isOrgMember() || hasRepoAccess()) {
    return { allowed: true, reason: 'ok', org: GATE_ORG };
  }
  return { allowed: false, reason: 'no-access', org: GATE_ORG };
};

/**
 * Format plain-language guidance for a blocked run.
 *
 * @param result - Failed gate result to explain.
 * @returns Buyer-readable remediation message.
 * @example
 * const message = formatGateFailure(result);
 */
export const formatGateFailure = (result: GateResult): string => {
  if (result.reason === 'gh-missing') {
    return 'VybeKiit needs the GitHub CLI to confirm your license. Install it by running: vybekiit doctor\nThen run this again.';
  }
  if (result.reason === 'gh-unauthed') {
    return "You're not signed in to GitHub yet. Sign in first with: gh auth login\nThen run this again.";
  }
  return [
    `We couldn't find VybeKiit access for your GitHub account.`,
    `To get started, purchase VybeKiit at ${SITE_URL} - you'll be invited automatically right after checkout.`,
    `Already purchased? Make sure you're signed in as the GitHub account you bought with (check with: gh auth status), then run this again.`,
  ].join('\n');
};

/**
 * Enforce the gate at the top of a command run. Returns true when access is confirmed;
 * otherwise prints guidance and returns false so the caller exits non-zero.
 *
 * @returns True when the command may proceed.
 * @example
 * const allowed = ensureAccessOrExit();
 */
export const ensureAccessOrExit = (): boolean => {
  const result = checkAccess();
  if (result.allowed) {
    return true;
  }
  process.stderr.write(`${formatGateFailure(result)}\n`);
  return false;
};
