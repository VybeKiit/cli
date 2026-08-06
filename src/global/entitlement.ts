import { type ExecFn, makeExec } from './exec';

/**
 * GitHub org holding the private per-surface kit mirrors (ADR-0005/0033). Read access to any
 * of these private repos is exactly the boundary a real `vybekiit create app` clone relies on,
 * so it doubles as the buyer entitlement for the global install — no second allowlist to keep.
 */
const MIRROR_ORG = 'VybeKiit';

/**
 * Surface mirrors we probe for read access. Buyers get the surfaces they purchased, and a match
 * on ANY one proves entitlement — so a mobile-only buyer still passes without owning `web`.
 */
const SURFACE_MIRRORS = ['web', 'mobile', 'backend', 'extension', 'spa'] as const;

/** Why the gate allowed or blocked the install. */
export type EntitlementReason = 'entitled' | 'gh-missing' | 'not-authenticated' | 'no-access';

/** Outcome of the buyer-entitlement check. */
export type EntitlementResult = {
  readonly entitled: boolean;
  readonly reason: EntitlementReason;
  /** Resolved GitHub login, when `gh` was signed in. */
  readonly login?: string;
  /** The mirror that proved access — present only when entitled. */
  readonly via?: string;
};

/** Injected `gh` runner, defaulting to the real binary. Swapped in tests. */
export type EntitlementDeps = {
  readonly exec: ExecFn;
};

const defaultDeps: EntitlementDeps = { exec: makeExec('gh') };

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

/**
 * Confirm the caller is an entitled VybeKiit buyer by reusing the scaffolder's gate: read
 * access to a private `VybeKiit/<surface>` mirror. Granting a buyer their mirror is what
 * unlocks scaffolding, so it unlocks the global install too — there is no separate list.
 *
 * Fail-closed: a missing `gh`, a signed-out `gh`, or no readable mirror all block the install.
 *
 * @param deps - Injected `gh` runner (defaults to the real binary).
 * @returns Whether to proceed, with a machine-readable reason + resolved login.
 * @example
 * const gate = await checkEntitlement();
 * if (!gate.entitled) process.exit(1);
 */
export const checkEntitlement = async (
  deps: EntitlementDeps = defaultDeps,
): Promise<EntitlementResult> => {
  const { exec } = deps;
  if ((await exec(['--version'])).code === 127) {
    return { entitled: false, reason: 'gh-missing' };
  }
  const login = await signedInGithubLogin(exec);
  if (login === null) {
    return { entitled: false, reason: 'not-authenticated' };
  }
  for (const surface of SURFACE_MIRRORS) {
    const repo = `${MIRROR_ORG}/${surface}`;
    if ((await exec(['api', `repos/${repo}`, '--silent'])).code === 0) {
      return { entitled: true, reason: 'entitled', login, via: repo };
    }
  }
  return { entitled: false, reason: 'no-access', login };
};

/**
 * Human-facing lines explaining a blocked install and the one fix, tuned for a non-technical
 * buyer. Never prints raw stderr.
 *
 * @param result - A non-entitled {@link EntitlementResult}.
 * @returns Lines to print (to stderr) in order.
 * @example
 * for (const line of formatEntitlementBlock(gate)) process.stderr.write(`${line}\n`);
 */
export const formatEntitlementBlock = (result: EntitlementResult): string[] => {
  const lines = [
    '',
    '✗ VybeKiit is a paid kit — this GitHub account is not on the buyer list.',
    '',
  ];
  if (result.reason === 'gh-missing') {
    lines.push(
      'GitHub CLI (gh) was not found. Install it from https://cli.github.com, then run',
      '  gh auth login --web',
      'signed in with the GitHub account you purchased VybeKiit with, and re-run.',
    );
  } else if (result.reason === 'not-authenticated') {
    lines.push(
      'You are not signed in to GitHub. Run',
      '  gh auth login --web',
      'with the GitHub account you purchased VybeKiit with, then re-run.',
    );
  } else {
    lines.push(
      `Signed in as '${result.login}', but that account can't access the VybeKiit kit.`,
      'If you have purchased, accept the repository invite (check your email or',
      'https://github.com/notifications), or email info@vybekiit.com.',
      '',
      'Not a buyer yet?  https://vybekiit.com',
    );
  }
  lines.push('');
  return lines;
};
