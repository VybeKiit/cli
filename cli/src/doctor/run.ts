import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { inferVybeAssistant } from '@vybekiit/report-mode';
import { loadEnvFile, mergeEnv, writeEnvKeys } from './env';
import { inferProjectSurfaceSync, reportModeEnvKeysForSurface } from '../lib/infer-project-surface';
import { formatPlatformSkillsReport, verifyPlatformSkills } from './platform-skills';
import { computeDoctorExitCode, reportFor } from './plan-doctor-run';
import { verifyProjectHealth } from './project-health';
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
 * Pure planning lives in `toolchain.ts` and `plan-doctor-run.ts`; this file is the
 * side-effecting executor (install, probe, env writes).
 */

function toPlatform(platform: NodeJS.Platform): Platform | null {
  return platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;
}

function isCursorSession(): boolean {
  return Boolean(process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID);
}

function succeeds(command: string, args: readonly string[]): boolean {
  return spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;
}

interface InstallOutcome {
  readonly ok: boolean;
  readonly missingRequirement?: string;
}

function errorCode(error: Error | undefined): string | undefined {
  return error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

function runInstall(action: InstallAction, log: Console): InstallOutcome {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const result = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(result.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: result.status === 0 };
}

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

export async function runDoctor(log: Console = console): Promise<number> {
  const platform = toPlatform(process.platform);
  if (!platform) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return 1;
  }

  const cwd = process.cwd();
  const surface = inferProjectSurfaceSync(cwd);
  const env = mergeEnv(process.env, loadEnvFile(cwd));
  const providerTools = selectToolchain(env, {
    mobile: surface.mobile,
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
  for (const line of projectHealth.lines) {
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
    writeEnvKeys(cwd, reportModeEnvKeysForSurface(surface, assistant));
    log.log(`✓ Report Mode — your assistant is set to ${assistant}.`);
  }

  return computeDoctorExitCode({
    cloudReady,
    r2Ok: r2Result.ok,
    agentReady,
    skillsReady,
    projectHealthOk: projectHealth.ok,
  });
}
