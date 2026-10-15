import process from 'node:process';
import { readGateIdentity } from '@vybekiit/core';
import { type AccessProblem, accessHelpLines } from '../doctor/accessHelp';
import { acceptRepositoryInvites } from '../doctor/repositoryInvites';
import { locateUnzippedKit } from '../lib/unzippedKit';
import { type ExecFn, makeExec } from './exec';

/** Why the gate allowed or blocked the install. */
export type EntitlementReason =
  | 'entitled'
  | 'kit-zip'
  | 'gh-missing'
  | 'not-authenticated'
  | 'no-access';

/** Outcome of the buyer-entitlement check. */
export type EntitlementResult = {
  readonly entitled: boolean;
  readonly reason: EntitlementReason;
  /** Resolved GitHub login, when `gh` was signed in. */
  readonly login?: string;
  /** The mirror that proved access — present only when entitled. */
  readonly via?: string;
};

/** Injected `gh` runner and unzipped-kit lookup, defaulting to the real ones. Swapped in tests. */
export type EntitlementDeps = {
  readonly exec: ExecFn;
  readonly unzippedKit: () => Promise<string | null>;
};

const defaultDeps: EntitlementDeps = { exec: makeExec('gh'), unzippedKit: locateUnzippedKit };

const ACCESS_PROBLEM_BY_REASON: Readonly<Partial<Record<EntitlementReason, AccessProblem>>> = {
  'gh-missing': 'gh-missing',
  'not-authenticated': 'gh-unauthed',
  'no-access': 'no-access',
};

/**
 * Resolve the signed-in GitHub login via `gh api user`.
 *
 * @param exec - `gh` runner.
 * @returns The login, or null when gh is missing / not authenticated.
 */
const signedInGithubLogin = async (exec: ExecFn): Promise<string | null> => {
  const res = await exec(['api', 'user', '--jq', '.login']);
  if (res.code !== 0) {
    return null;
  }
  const login = res.stdout.trim();
  return login === '' ? null : login;
};

const firstReadableRepo = async (
  exec: ExecFn,
  org: string,
  repos: readonly string[],
): Promise<string | undefined> =>
  await repos.reduce<Promise<string | undefined>>(async (earlierMatch, repo) => {
    const readableRepo = await earlierMatch;
    if (readableRepo !== undefined) {
      return readableRepo;
    }
    const fullName = `${org}/${repo}`;
    const repoProbe = await exec(['api', `repos/${fullName}`, '--silent']);
    return repoProbe.code === 0 ? fullName : undefined;
  }, Promise.resolve(undefined));

/**
 * Confirm the caller is an entitled VybeKiit buyer by reusing the access gate: an unzipped kit
 * from the ZIP download, or read access to one private delivery repo from {@link readGateIdentity}.
 * Pending repo invites from the org are accepted first, so a buyer who never opened the invite
 * email still passes.
 *
 * Fail-closed: without an unzipped kit, a missing `gh`, a signed-out `gh`, or no readable repo
 * all block the install.
 *
 * @param deps - Injected `gh` runner and unzipped-kit lookup (default to the real ones).
 * @returns Whether to proceed, with a machine-readable reason + resolved login.
 * @example
 * const gate = await checkEntitlement();
 * if (!gate.entitled) process.exit(1);
 */
export const checkEntitlement = async (
  deps: EntitlementDeps = defaultDeps,
): Promise<EntitlementResult> => {
  const { exec, unzippedKit } = deps;
  if ((await unzippedKit()) !== null) {
    return { entitled: true, reason: 'kit-zip' };
  }
  if ((await exec(['--version'])).code === 127) {
    return { entitled: false, reason: 'gh-missing' };
  }
  const login = await signedInGithubLogin(exec);
  if (login === null) {
    return { entitled: false, reason: 'not-authenticated' };
  }
  const { org, repos } = readGateIdentity(process.env);
  await acceptRepositoryInvites(exec, org);
  const readableRepo = await firstReadableRepo(exec, org, repos);
  return readableRepo === undefined
    ? { entitled: false, reason: 'no-access', login }
    : { entitled: true, reason: 'entitled', login, via: readableRepo };
};

/**
 * Human-facing lines explaining a blocked install and the one fix, tuned for a non-technical
 * buyer. Never prints raw stderr.
 *
 * @param entitlement - A non-entitled {@link EntitlementResult}.
 * @returns Lines to print (to stderr) in order.
 * @example
 * for (const line of formatEntitlementBlock(gate)) process.stderr.write(`${line}\n`);
 */
export const formatEntitlementBlock = (entitlement: EntitlementResult): string[] => {
  const accessProblem = ACCESS_PROBLEM_BY_REASON[entitlement.reason];
  const helpLines = accessProblem === undefined ? [] : accessHelpLines(accessProblem);
  const accountLines =
    entitlement.login === undefined ? [] : [`Signed in to GitHub as ${entitlement.login}.`];
  return ['', ...accountLines, ...helpLines, ''];
};
