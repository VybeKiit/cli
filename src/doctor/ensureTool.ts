import process from 'node:process';
import { type DoctorLog, processDoctorLog } from './doctorLog';
import { saveToolFoldersOnPath } from './shellPath';
import { findToolByName } from './toolchain';
import {
  installMissingTools,
  probeToolAuth,
  probeToolPresence,
  supportedDoctorPlatform,
} from './toolInstall';

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

/**
 * Ensure a single named tool is installed (installing if missing) and report its auth
 * state. Idempotent: an already-present tool triggers no install.
 */
export const ensureTool = async (
  name: string,
  log: DoctorLog = processDoctorLog,
): Promise<EnsureToolStatus> => {
  const tool = findToolByName(name);
  if (tool === undefined) {
    return { tool: name, known: false, installed: false, installedNow: false, authed: null };
  }

  const platform = supportedDoctorPlatform(process.platform);
  if (!platform) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return { tool: name, known: true, installed: false, installedNow: false, authed: null };
  }

  const present = await probeToolPresence(tool);
  const installs = await installMissingTools(platform, [tool], [{ tool: tool.name, present }], log);
  const install = installs.get(tool.name);
  const installedNow = install?.ok === true;
  if (installedNow) {
    await saveToolFoldersOnPath();
  }

  const installed = present || installedNow;
  const authed = installed ? await probeToolAuth(tool) : null;
  const loginHint =
    installed && authed === false && tool.auth !== undefined ? tool.auth.loginHint : undefined;
  const missingRequirement = install?.missingRequirement;

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
