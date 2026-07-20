import { spawnSync } from 'node:child_process';
import process from 'node:process';
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

export type EnsureToolResult = {
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
 * Narrow Node's platform string to the OS families doctor supports.
 *
 * @param platform - Raw `process.platform` value.
 * @returns Supported platform, or null when unsupported.
 * @example
 * const platform = toPlatform(process.platform);
 */
const toPlatform = (platform: NodeJS.Platform): Platform | null =>
  platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;

/**
 * Probe whether a command exits successfully.
 *
 * @param command - Executable to run.
 * @param args - Arguments passed to the executable.
 * @returns True when the command exits with status zero.
 * @example
 * const installed = succeeds('gh', ['--version']);
 */
const succeeds = (command: string, args: readonly string[]): boolean =>
  spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;

/**
 * Read a Node spawn error code when one exists.
 *
 * @param error - Optional spawn error.
 * @returns Error code string, or undefined when absent.
 * @example
 * const code = errorCode(result.error);
 */
const errorCode = (error: Error | undefined): string | undefined =>
  error !== undefined && 'code' in error && typeof error.code === 'string' ? error.code : undefined;

/**
 * Run one install action and translate missing prerequisites.
 *
 * @param action - Planned install command.
 * @param log - Logger used for buyer-visible progress.
 * @returns Install success and optional missing prerequisite.
 * @example
 * const outcome = runInstall(action, console);
 */
const runInstall = (
  action: InstallAction,
  log: Pick<Console, 'log'>,
): { ok: boolean; missingRequirement?: string } => {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const result = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(result.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: result.status === 0 };
};

/**
 * Probe auth for tools that declare an auth check.
 *
 * @param tool - Tool declaration to probe.
 * @returns Auth state, or null when no auth probe exists.
 * @example
 * const authed = probeAuth(tool);
 */
const probeAuth = (tool: Tool): boolean | null => {
  if (tool.auth === undefined) {
    return null;
  }
  return succeeds(tool.auth.command, tool.auth.args);
};

/**
 * Ensure a single named tool is installed (installing if missing) and report its auth
 * state. Idempotent: an already-present tool triggers no install.
 *
 * @param name - Tool name requested by the caller.
 * @param log - Logger used for install progress and setup errors.
 * @returns Ensure result describing installation and auth state.
 */
export const ensureTool = (
  name: string,
  log: Pick<Console, 'log' | 'error'> = console,
): EnsureToolResult => {
  const tool = findToolByName(name);
  if (tool === undefined) {
    return { tool: name, known: false, installed: false, installedNow: false, authed: null };
  }

  const platform = toPlatform(process.platform);
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

/**
 * Format one ensure result as a buyer-readable status line.
 *
 * @param result - Ensure result to format.
 * @returns Human-readable setup status.
 * @example
 * const line = formatEnsureResult(result);
 */
export const formatEnsureResult = (result: EnsureToolResult): string => {
  if (!result.known) {
    return `✗ ${result.tool} - not a known tool. Run \`vybekiit doctor\` for the full check.`;
  }
  if (!result.installed) {
    const fix = result.missingRequirement
      ? ` Install ${result.missingRequirement} first, then re-run.`
      : ' Re-run to try again.';
    return `✗ ${result.tool} - couldn't be set up.${fix}`;
  }
  const state = result.installedNow ? 'installed just now' : 'already installed';
  if (result.authed === false) {
    return `→ ${result.tool} - ${state}, but you're not signed in yet. One-time: run \`${result.loginHint}\`.`;
  }
  return `✓ ${result.tool} - ready (${state}).`;
};
