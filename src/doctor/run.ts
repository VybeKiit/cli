import { spawnSync } from 'node:child_process';
import {
  type InstallAction,
  type Platform,
  TOOLCHAIN,
  type Tool,
  type ToolPresence,
  type ToolReport,
  formatReport,
  planInstall,
} from './toolchain';

/**
 * `vybekiit doctor` — provision + verify the agentic toolchain (ADR-0001).
 *
 * The agent runs this on the buyer's machine so the CLIs it needs (`supabase`,
 * `wrangler`) are installed globally and signed in, without the buyer configuring
 * anything. This file is the side-effecting half: it detects what's present, installs
 * what's missing the OS-correct way, probes sign-in, and prints buyer-readable lines.
 * All decision logic lives in the pure `toolchain.ts` so it stays testable.
 */

/** Map node's `process.platform` onto a supported {@link Platform}, or null if we can't install there. */
function toPlatform(platform: NodeJS.Platform): Platform | null {
  return platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;
}

/** Run a command silently and report whether it exited cleanly — the basis of every probe. */
function succeeds(command: string, args: readonly string[]): boolean {
  return spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;
}

/** Outcome of one install attempt; a missing prerequisite is distinguished from a failed run. */
interface InstallOutcome {
  readonly ok: boolean;
  readonly missingRequirement?: string;
}

/** Read a spawn error's `code` (e.g. `ENOENT`) without asserting the Node error subtype. */
function errorCode(error: Error | undefined): string | undefined {
  return error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

/** Run one install action, surfacing an absent package manager (ENOENT) as a translatable hint. */
function runInstall(action: InstallAction, log: Console): InstallOutcome {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const result = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(result.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: result.status === 0 };
}

/** Resolve one tool's final state: installed? (already there or just installed) and signed in? */
function buildReport(
  tool: Tool,
  presence: readonly ToolPresence[],
  installs: ReadonlyMap<string, InstallOutcome>,
): ToolReport {
  const wasPresent = presence.find((p) => p.tool === tool.name)?.present ?? false;
  const install = installs.get(tool.name);
  const installed = wasPresent || install?.ok === true;

  if (!installed) {
    const requirement = install?.missingRequirement;
    return {
      tool: tool.name,
      purpose: tool.purpose,
      installed: false,
      authed: null,
      ...(requirement ? { missingRequirement: requirement } : {}),
    };
  }
  if (!tool.auth) {
    return { tool: tool.name, purpose: tool.purpose, installed: true, authed: null };
  }
  const authed = succeeds(tool.auth.command, tool.auth.args);
  return {
    tool: tool.name,
    purpose: tool.purpose,
    installed: true,
    authed,
    ...(authed ? {} : { loginHint: tool.auth.loginHint }),
  };
}

/**
 * Orchestrate a full doctor run. Returns a process exit code: 0 when every tool is
 * installed (sign-in still pending is fine — that's a guided next step the agent
 * handles), 1 when a tool couldn't be installed or the OS is unsupported.
 */
export function runDoctor(log: Console = console): number {
  const platform = toPlatform(process.platform);
  if (!platform) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return 1;
  }

  const presence: ToolPresence[] = TOOLCHAIN.map((tool) => ({
    tool: tool.name,
    present: succeeds(tool.name, tool.versionArgs),
  }));

  const installs = new Map<string, InstallOutcome>();
  for (const action of planInstall(platform, presence)) {
    installs.set(action.tool, runInstall(action, log));
  }

  const reports = TOOLCHAIN.map((tool) => buildReport(tool, presence, installs));
  for (const line of formatReport(reports)) {
    log.log(line);
  }

  return reports.every((report) => report.installed) ? 0 : 1;
}
