import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { inferVybeAssistant } from '@vybekiit/report-mode';
import { loadEnvFile, mergeEnv, writeEnvKeys } from './env';
import { formatPlatformSkillsReport, verifyPlatformSkills } from './platform-skills';
import { formatProjectHealthReport, verifyProjectHealth } from './project-health';
import { provisionR2Storage } from './storage-r2';
import { formatProductSurfaceHints } from './product-surface';
import { ensureCodexSkillsEnabled } from './codex-config';
import {
  formatRailwayStackReport,
  isRailwayStackActive,
  runRailwayAgentSetup,
} from './railway-agent-setup';
import {
  formatReport,
  type InstallAction,
  isAgentRuntimeReady,
  isSkillsCliReady,
  mergeAgentAndProviderTools,
  type Platform,
  planInstall,
  selectToolchain,
  type Tool,
  type ToolPresence,
  type ToolReport,
} from './toolchain';

/**
 * `vybekiit doctor` — provision + verify the agentic toolchain (ADR-0001).
 *
 * The agent runs this on the buyer's machine so the CLIs it needs are installed
 * globally and signed in, without the buyer configuring anything. It is
 * provider-aware: {@link selectToolchain} reads the `*_PROVIDER` env keys so only the
 * CLIs the buyer's active adapters use get installed (defaults → `supabase` +
 * `wrangler`), plus the mobile build/publish tools (`eas` + `launch`) when the cwd is
 * an Expo project. This file is the side-effecting half: it detects what's present,
 * installs what's missing the OS-correct way, probes sign-in, and prints
 * buyer-readable lines. All decision logic lives in the pure `toolchain.ts` so it
 * stays testable.
 */

/** Map node's `process.platform` onto a supported {@link Platform}, or null if we can't install there. */
function toPlatform(platform: NodeJS.Platform): Platform | null {
  return platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;
}

/**
 * True when `dir` is an Expo project — the signal that the mobile build/publish tools
 * (`eas` + `launch`) belong in the toolchain. We treat an `app.json` (or
 * `app.config.json`) carrying an `expo` key as the marker; a parse failure or a plain
 * config without that key reads as "not mobile", keeping the web default untouched.
 */
function isMobileProject(dir: string): boolean {
  for (const file of ['app.json', 'app.config.json']) {
    const path = join(dir, file);
    if (!existsSync(path)) {
      continue;
    }
    try {
      const config: unknown = JSON.parse(readFileSync(path, 'utf8'));
      if (typeof config === 'object' && config !== null && 'expo' in config) {
        return true;
      }
    } catch {
      // Unreadable/invalid config → not a recognized mobile project.
    }
  }
  return false;
}

/** True when `dir` is a WXT browser-extension project. */
function isExtensionProject(dir: string): boolean {
  return existsSync(join(dir, 'wxt.config.ts'));
}

/** Env keys Report Mode reads per template surface. */
function reportModeEnvKeys(cwd: string, assistant: string): Record<string, string> {
  if (isMobileProject(cwd)) {
    return { EXPO_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  if (isExtensionProject(cwd)) {
    return { WXT_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  return { VYBE_ASSISTANT: assistant };
}

/** True when running inside Cursor (IDE — no separate CLI install needed). */
function isCursorSession(): boolean {
  return Boolean(process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID);
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

function reportFor(reports: readonly ToolReport[], name: string): ToolReport | undefined {
  return reports.find((r) => r.tool === name);
}

/**
 * Orchestrate a full doctor run. Returns a process exit code: 0 when every tool is
 * installed (sign-in still pending is fine — that's a guided next step the agent
 * handles), 1 when a tool couldn't be installed or the OS is unsupported.
 */
export async function runDoctor(log: Console = console): Promise<number> {
  const platform = toPlatform(process.platform);
  if (!platform) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return 1;
  }

  const cwd = process.cwd();
  const env = mergeEnv(process.env, loadEnvFile(cwd));
  const providerTools = selectToolchain(env, {
    mobile: isMobileProject(cwd),
    wantsGoogleAuth: Boolean(env.GOOGLE_OAUTH_CLIENT_ID),
  });
  const toolchain = mergeAgentAndProviderTools(providerTools);

  if (isCursorSession()) {
    log.log("✓ Cursor — you're in Cursor; no separate agent install needed.");
  }

  const presence: ToolPresence[] = toolchain.map((tool) => ({
    tool: tool.name,
    present: succeeds(tool.name, tool.versionArgs),
  }));

  const installs = new Map<string, InstallOutcome>();
  for (const action of planInstall(platform, presence, toolchain)) {
    installs.set(action.tool, runInstall(action, log));
  }

  const reports = toolchain.map((tool) => buildReport(tool, presence, installs));
  for (const line of formatReport(reports)) {
    log.log(line);
  }

  if (isRailwayStackActive(env)) {
    const railway = reportFor(reports, 'railway');
    const agentSetup = runRailwayAgentSetup(railway?.installed === true, railway?.authed ?? null);
    for (const line of formatRailwayStackReport(env, agentSetup)) {
      log.log(line);
    }
  }

  const skillsReport = verifyPlatformSkills(cwd);
  for (const line of formatPlatformSkillsReport(skillsReport)) {
    log.log(line);
  }

  const projectHealth = verifyProjectHealth(cwd);
  for (const line of formatProjectHealthReport(projectHealth)) {
    log.log(line);
  }

  const r2Result = await provisionR2Storage(cwd, env, log);
  log.log(`[doctor] ${r2Result.message}`);

  for (const line of formatProductSurfaceHints(env)) {
    log.log(line);
  }

  const cloudReady = providerTools.every((tool) => {
    const report = reportFor(reports, tool.name);
    return report?.installed === true;
  });
  const cursorSession = isCursorSession();
  const agentReady = isAgentRuntimeReady(reports) || cursorSession;
  const skillsReady = isSkillsCliReady(reports);

  const codex = reportFor(reports, 'codex');
  if (codex?.installed) {
    const codexSkills = await ensureCodexSkillsEnabled();
    if (codexSkills.updated) {
      log.log('✓ Codex — enabled Agent Skills discovery in ~/.codex/config.toml.');
    } else {
      log.log('✓ Codex — Agent Skills discovery already enabled.');
    }
  }

  const assistant = inferVybeAssistant({
    cursorSession,
    claudeInstalled: reportFor(reports, 'claude')?.installed === true,
    codexInstalled: codex?.installed === true,
  });
  if (assistant) {
    writeEnvKeys(cwd, reportModeEnvKeys(cwd, assistant));
    log.log(`✓ Report Mode — your assistant is set to ${assistant}.`);
  }

  const ready = cloudReady && r2Result.ok && agentReady && skillsReady && projectHealth.ok;
  return ready ? 0 : 1;
}
