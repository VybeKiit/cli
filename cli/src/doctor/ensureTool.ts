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

export interface EnsureToolResult {
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
}

function toPlatform(platform: NodeJS.Platform): Platform | null {
  return platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;
}

function succeeds(command: string, args: readonly string[]): boolean {
  return spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;
}

function errorCode(error: Error | undefined): string | undefined {
  return error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

function runInstall(
  action: InstallAction,
  log: Pick<Console, 'log'>,
): { ok: boolean; missingRequirement?: string } {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const result = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(result.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: result.status === 0 };
}

function probeAuth(tool: Tool): boolean | null {
  if (!tool.auth) return null;
  return succeeds(tool.auth.command, tool.auth.args);
}

/**
 * Ensure a single named tool is installed (installing if missing) and report its auth
 * state. Idempotent: an already-present tool triggers no install.
 */
export function ensureTool(
  name: string,
  log: Pick<Console, 'log' | 'error'> = console,
): EnsureToolResult {
  const tool = findToolByName(name);
  if (!tool) {
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
    if (action) {
      const outcome = runInstall(action, log);
      installedNow = outcome.ok;
      missingRequirement = outcome.missingRequirement;
    }
  }

  const installed = present || installedNow;
  const authed = installed ? probeAuth(tool) : null;
  const loginHint = installed && authed === false ? tool.auth?.loginHint : undefined;

  return {
    tool: tool.name,
    known: true,
    installed,
    installedNow,
    authed,
    ...(loginHint ? { loginHint } : {}),
    ...(missingRequirement ? { missingRequirement } : {}),
  };
}

/** Human-readable summary line for one ensure result. */
export function formatEnsureResult(result: EnsureToolResult): string {
  if (!result.known) {
    return `✗ ${result.tool} — not a known tool. Run \`vybekiit doctor\` for the full check.`;
  }
  if (!result.installed) {
    const fix = result.missingRequirement
      ? ` Install ${result.missingRequirement} first, then re-run.`
      : ' Re-run to try again.';
    return `✗ ${result.tool} — couldn't be set up.${fix}`;
  }
  const state = result.installedNow ? 'installed just now' : 'already installed';
  if (result.authed === false) {
    return `→ ${result.tool} — ${state}, but you're not signed in yet. One-time: run \`${result.loginHint}\`.`;
  }
  return `✓ ${result.tool} — ready (${state}).`;
}
