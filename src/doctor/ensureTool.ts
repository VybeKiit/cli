import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { type DoctorLog, processDoctorLog } from './doctorLog';
import {
  findToolByName,
  type InstallAction,
  type Platform,
  planInstall,
  type Tool,
  type ToolPresence,
} from './toolchain';

/**
 * On-demand, single-tool ensure — the reusable core behind `vybekiit doctor --ensure <tool>`.
 *
 * This is deliberately NOT a parallel preflight layer: it reuses the exact tool
 * declarations, per-OS install steps, and auth probes from {@link toolchain} plus the same
 * {@link planInstall} planner the full `doctor` sweep uses. A provider automation calls it
 * (via subprocess) to precheck/install just the one CLI it needs before minting a token.
 */

export type EnsureToolStatus = {
  readonly tool: string;
  /** False when the tool name isn't a known toolchain entry. */
  readonly known: boolean;
  /** Present on PATH after the (idempotent) install attempt. */
  readonly installed: boolean;
  /** True when this run performed an install (was missing beforehand). */
  readonly installedNow: boolean;
  /** `true`/`false` if the tool needs sign-in, `null` if it doesn't. */
  readonly authed: boolean | null;
  /** Set when installed but not signed in — the one command the buyer runs. */
  readonly loginHint?: string;
  /** Set when install failed for a missing prerequisite (e.g. Homebrew). */
  readonly missingRequirement?: string;
};

/** Node OS family doctor can install on, or null when unsupported. */
const supportedDoctorPlatform = (nodePlatform: NodeJS.Platform): Platform | null =>
  nodePlatform === 'darwin' || nodePlatform === 'win32' || nodePlatform === 'linux'
    ? nodePlatform
    : null;

/** True when the command exits with status zero. */
const succeeds = (command: string, spawnArgs: readonly string[]): boolean =>
  spawnSync(command, [...spawnArgs], { stdio: 'ignore' }).status === 0;

/** Node spawn error code when present. */
const errorCode = (spawnError: Error | undefined): string | undefined =>
  spawnError !== undefined && 'code' in spawnError && typeof spawnError.code === 'string'
    ? spawnError.code
    : undefined;

/** Run one planned install command and translate missing prerequisites. */
const runInstall = (
  action: InstallAction,
  log: DoctorLog,
): { ok: boolean; missingRequirement?: string } => {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const installProcess = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(installProcess.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: installProcess.status === 0 };
};

/** Auth probe outcome for tools that declare one, else null. */
const probeAuth = (tool: Tool): boolean | null => {
  if (tool.auth === undefined) {
    return null;
  }
  return succeeds(tool.auth.command, tool.auth.args);
};

/**
 * Ensure a single named tool is installed (installing if missing) and report its auth
 * state. Idempotent: an already-present tool triggers no install.
 */
export const ensureTool = (name: string, log: DoctorLog = processDoctorLog): EnsureToolStatus => {
  const tool = findToolByName(name);
  if (tool === undefined) {
    return { tool: name, known: false, installed: false, installedNow: false, authed: null };
  }

  const platform = supportedDoctorPlatform(process.platform);
  if (!platform) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return { tool: name, known: true, installed: false, installedNow: false, authed: null };
  }

  const present = succeeds(tool.name, tool.versionArgs);
  const presence: ToolPresence[] = [{ tool: tool.name, present }];

  let installedNow = false;
  let missingRequirement: string | undefined;
  if (!present) {
    const [action] = planInstall(platform, presence, [tool]);
    if (action !== undefined) {
      const outcome = runInstall(action, log);
      ({ missingRequirement } = outcome);
      installedNow = outcome.ok;
    }
  }

  const installed = present || installedNow;
  const authed = installed ? probeAuth(tool) : null;
  const loginHint =
    installed && authed === false && tool.auth !== undefined ? tool.auth.loginHint : undefined;

  return {
    tool: tool.name,
    known: true,
    installed,
    installedNow,
    authed,
    ...(loginHint ? { loginHint } : {}),
    ...(missingRequirement ? { missingRequirement } : {}),
  };
};

/** Buyer-readable status line for one ensure-tool check. */
export const formatEnsureStatus = (ensureStatus: EnsureToolStatus): string => {
  if (!ensureStatus.known) {
    return `✗ ${ensureStatus.tool} - not a known tool. Run \`vybekiit doctor\` for the full check.`;
  }
  if (!ensureStatus.installed) {
    const fix = ensureStatus.missingRequirement
      ? ` Install ${ensureStatus.missingRequirement} first, then re-run.`
      : ' Re-run to try again.';
    return `✗ ${ensureStatus.tool} - couldn't be set up.${fix}`;
  }
  const installLabel = ensureStatus.installedNow ? 'installed just now' : 'already installed';
  if (ensureStatus.authed === false) {
    return `→ ${ensureStatus.tool} - ${installLabel}, but you're not signed in yet. One-time: run \`${ensureStatus.loginHint}\`.`;
  }
  return `✓ ${ensureStatus.tool} - ready (${installLabel}).`;
};
