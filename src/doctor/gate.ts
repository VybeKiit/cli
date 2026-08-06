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
  const siteUrl = process.env.VYBEKIIT_SITE_URL;
  if (siteUrl !== undefined && siteUrl.trim() !== '') {
    return siteUrl;
  }
  return 'https://vybekiit.com';
})();

export type GateReason = 'ok' | 'skipped' | 'gh-missing' | 'gh-unauthed' | 'no-access';

export type GateDecision = {
  readonly allowed: boolean;
  readonly reason: GateReason;
  readonly org: string;
};

/** True when `gh` with the given args exits successfully. */
const ghSucceeds = (ghArgs: readonly string[]): boolean =>
  spawnSync('gh', [...ghArgs], { stdio: 'ignore' }).status === 0;

/** True when the signed-in user is an active member of the gate org. */
const isOrgMember = (): boolean => {
  const membershipProbe = spawnSync(
    'gh',
    ['api', `user/memberships/orgs/${GATE_ORG}`, '--jq', '.state'],
    {
      encoding: 'utf8',
    },
  );
  const membershipStdout = membershipProbe.stdout === undefined ? '' : membershipProbe.stdout;
  return membershipProbe.status === 0 && membershipStdout.trim() === 'active';
};

/** True when the signed-in user can read at least one private delivery repo. */
const hasRepoAccess = (): boolean =>
  GATE_REPOS.some((repo) => ghSucceeds(['api', `repos/${GATE_ORG}/${repo}`]));

/** Whether the signed-in GitHub account holds a VybeKiit license. */
export const checkAccess = (): GateDecision => {
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

/** Plain-language remediation for a blocked gate decision. */
export const formatGateFailure = (failedGate: GateDecision): string => {
  if (failedGate.reason === 'gh-missing') {
    return 'VybeKiit needs the GitHub CLI to confirm your license. Install it by running: vybekiit doctor\nThen run this again.';
  }
  if (failedGate.reason === 'gh-unauthed') {
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
 */
export const ensureAccessOrExit = (): boolean => {
  const gateDecision = checkAccess();
  if (gateDecision.allowed) {
    return true;
  }
  process.stderr.write(`${formatGateFailure(gateDecision)}\n`);
  return false;
};
