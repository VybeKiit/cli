import process from 'node:process';
import { readGateIdentity } from '@vybekiit/core';
import { type ExecFn, makeExec } from '../global/exec';
import { locateUnzippedKit } from '../lib/unzippedKit';
import { accessHelpLines, isAccessProblem } from './accessHelp';
import { acceptRepositoryInvites } from './repositoryInvites';

/**
 * The access gate — VybeKiit's paid wall on the CLI.
 *
 * A paid purchase invites the buyer's GitHub account to the private delivery repos
 * (see apps/landing AccessGate). Every command except help/version/doctor runs this first:
 * pending invites from the org are accepted, then the signed-in GitHub account must be a
 * member of the org OR a collaborator on a delivery repo. Otherwise we print plain help
 * and exit — re-running re-checks, so once access is granted it simply passes.
 * Buyers without GitHub download the kit as a ZIP from a signed link instead, so an unzipped
 * kit folder (around the current folder, or the one setup remembered) also passes.
 * Set VYBEKIIT_SKIP_GATE=1 to bypass in CI/automation.
 *
 * Org/repos SSOT: {@link readGateIdentity} (same defaults as landing grant).
 */

const { org: GATE_ORG, repos: GATE_REPOS } = readGateIdentity(process.env);

export type GateReason = 'ok' | 'skipped' | 'kit-zip' | 'gh-missing' | 'gh-unauthed' | 'no-access';

export type GateDecision = {
  readonly allowed: boolean;
  readonly reason: GateReason;
  readonly org: string;
};

const isOrgMember = async (gh: ExecFn): Promise<boolean> => {
  const membershipProbe = await gh(['api', `user/memberships/orgs/${GATE_ORG}`, '--jq', '.state']);
  return membershipProbe.code === 0 && membershipProbe.stdout.trim() === 'active';
};

const hasRepoAccess = async (gh: ExecFn): Promise<boolean> => {
  const repoProbes = await Promise.all(
    GATE_REPOS.map((repo) => gh(['api', `repos/${GATE_ORG}/${repo}`, '--silent'])),
  );
  return repoProbes.some((repoProbe) => repoProbe.code === 0);
};

/** Whether the signed-in GitHub account holds a VybeKiit license. */
export const checkAccess = async (
  gh: ExecFn = makeExec('gh'),
  unzippedKit: () => Promise<string | null> = locateUnzippedKit,
): Promise<GateDecision> => {
  if (process.env.VYBEKIIT_SKIP_GATE === '1') {
    return { allowed: true, reason: 'skipped', org: GATE_ORG };
  }
  if ((await unzippedKit()) !== null) {
    return { allowed: true, reason: 'kit-zip', org: GATE_ORG };
  }
  const versionProbe = await gh(['--version']);
  if (versionProbe.code !== 0) {
    return { allowed: false, reason: 'gh-missing', org: GATE_ORG };
  }
  const authProbe = await gh(['auth', 'status']);
  if (authProbe.code !== 0) {
    return { allowed: false, reason: 'gh-unauthed', org: GATE_ORG };
  }
  await acceptRepositoryInvites(gh, GATE_ORG);
  const allowed = (await isOrgMember(gh)) || (await hasRepoAccess(gh));
  return { allowed, reason: allowed ? 'ok' : 'no-access', org: GATE_ORG };
};

/** Plain-language remediation for a blocked gate decision. */
export const formatGateFailure = (failedGate: GateDecision): string => {
  const problem = isAccessProblem(failedGate.reason) ? failedGate.reason : 'no-access';
  return accessHelpLines(problem).join('\n');
};

/**
 * Enforce the gate at the top of a command run. Returns true when access is confirmed;
 * otherwise prints guidance and returns false so the caller exits non-zero.
 */
export const ensureAccessOrExit = async (): Promise<boolean> => {
  const gateDecision = await checkAccess();
  if (gateDecision.allowed) {
    return true;
  }
  process.stderr.write(`${formatGateFailure(gateDecision)}\n`);
  return false;
};
