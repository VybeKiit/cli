import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { inferVybeAssistant } from '@vybekiit/report-mode';
import { inferProjectSurfaceSync, reportModeEnvKeysForSurface } from '../lib/inferProjectSurface';
import { runAgentExperience } from './agentExperience';
import { verifyAssetsPipeline } from './assetsValidate';
import { formatGlobalStatus, readGlobalStatus } from './claudeGlobalConfig';
import { ensureCodexSkillsEnabled } from './codexConfig';
import { loadEnvFile, mergeEnv, writeEnvKeys } from './env';
import { verifyKitWorkspaceHealth } from './kitWorkspaceHealth';
import { createDefaultCommandProbe, verifyMobilePublishReadiness } from './mobilePublishReadiness';
import { mergeDoctorTools, selectNativeTools } from './nativeToolchain';
import { verifyPerfReadiness } from './perfReadiness';
import { computeDoctorExitCode, reportFor } from './planDoctorRun';
import { formatPlatformSkillsReport, verifyPlatformSkills } from './platformSkills';
import { formatProductSurfaceHints } from './productSurface';
import { verifyProjectHealth } from './projectHealth';
import {
  formatRailwayStackReport,
  isRailwayStackActive,
  runRailwayAgentSetup,
} from './railwayAgentSetup';
import { runNativeProjectSetup } from './runNativeProjectSetup';
import { provisionR2Storage } from './storageR2';
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
import { verifyEmailWorkerDoctor } from './verifyEmailWorker';
import { verifyGodaddyDoctor } from './verifyGodaddy';
import { verifyNamecheapDoctor } from './verifyNamecheap';
import { verifyPresetsDoctor } from './verifyPresets';

/**
 * `vybekiit doctor` — provision + verify the agentic toolchain (ADR-0001).
 *
 * Pure planning lives in `toolchain.ts` and `plan-doctor-run.ts`; this file is the
 * side-effecting executor (install, probe, env writes).
 */

/**
 * Narrow Node's platform string to doctor-supported OS families.
 *
 * @param platform - Raw `process.platform` value.
 * @returns Supported platform, or null when unsupported.
 * @example
 * const platform = toPlatform(process.platform);
 */
const toPlatform = (platform: NodeJS.Platform): Platform | null =>
  platform === 'darwin' || platform === 'win32' || platform === 'linux' ? platform : null;

/**
 * Detect whether the current process is running inside Cursor.
 *
 * @returns True when Cursor session env markers are present.
 * @example
 * const cursorSession = isCursorSession();
 */
const isCursorSession = (): boolean =>
  Boolean(process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID);

/**
 * Probe whether a command exits successfully.
 *
 * @param command - Executable to run.
 * @param args - Arguments passed to the executable.
 * @returns True when the command exits with status zero.
 * @example
 * const present = succeeds('gh', ['--version']);
 */
const succeeds = (command: string, args: readonly string[]): boolean =>
  spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;

type InstallOutcome = {
  readonly ok: boolean;
  readonly missingRequirement?: string;
};

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
 * Run one install action.
 *
 * @param action - Planned install command.
 * @param log - Logger used for progress.
 * @returns Install outcome with optional missing prerequisite.
 * @example
 * const outcome = runInstall(action, console);
 */
const runInstall = (action: InstallAction, log: Console): InstallOutcome => {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const result = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(result.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: result.status === 0 };
};

/**
 * Build the final report for one tool after probing and install attempts.
 *
 * @param tool - Tool declaration.
 * @param presence - Pre-install tool presence list.
 * @param installs - Install outcomes by tool name.
 * @returns Final report for the tool.
 * @example
 * const report = buildReport(tool, presence, installs);
 */
const buildReport = (
  tool: Tool,
  presence: readonly ToolPresence[],
  installs: ReadonlyMap<string, InstallOutcome>,
): ToolReport => {
  const presenceEntry = presence.find((entry) => entry.tool === tool.name);
  const wasPresent = presenceEntry === undefined ? false : presenceEntry.present;
  const install = installs.get(tool.name);
  const installed = wasPresent || install?.ok === true;

  if (!installed) {
    const requirement = install === undefined ? undefined : install.missingRequirement;
    return {
      tool: tool.name,
      purpose: tool.purpose,
      installed: false,
      authed: null,
      ...(requirement ? { missingRequirement: requirement } : {}),
    };
  }
  if (tool.auth === undefined) {
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
};

type DoctorToolRun = {
  readonly providerTools: readonly Tool[];
  readonly nativeTools: readonly Tool[];
  readonly reports: readonly ToolReport[];
};

/**
 * Write report lines to the doctor logger.
 *
 * @param log - Doctor logger.
 * @param lines - Lines to write.
 * @returns Void after all lines are written.
 * @example
 * writeLines(console, ['Done.']);
 */
const writeLines = (log: Console, lines: readonly string[]): void => {
  for (const line of lines) {
    log.log(line);
  }
};

/**
 * Probe and install the full selected toolchain.
 *
 * @param platform - Current OS family.
 * @param surface - Inferred project surface.
 * @param env - Merged doctor environment.
 * @param log - Doctor logger.
 * @returns Provider/native tools and final reports.
 * @example
 * const run = runToolchain(platform, surface, env, console);
 */
const runToolchain = (
  platform: Platform,
  surface: ReturnType<typeof inferProjectSurfaceSync>,
  env: Record<string, string | undefined>,
  log: Console,
): DoctorToolRun => {
  const providerTools = selectToolchain(env, {
    mobile: surface.mobile,
    wantsGoogleAuth: Boolean(env.GOOGLE_OAUTH_CLIENT_ID),
  });
  const nativeTools = selectNativeTools(surface, platform);
  const providerAndNative = mergeDoctorTools(providerTools, nativeTools);
  const toolchain = mergeAgentAndProviderTools(providerAndNative);
  const presence: ToolPresence[] = toolchain.map((tool) => ({
    tool: tool.name,
    present: succeeds(tool.name, tool.versionArgs),
  }));
  const installs = new Map<string, InstallOutcome>();
  for (const action of planInstall(platform, presence, toolchain)) {
    installs.set(action.tool, runInstall(action, log));
  }

  return {
    providerTools,
    nativeTools,
    reports: toolchain.map((tool) => buildReport(tool, presence, installs)),
  };
};

/**
 * Verify mobile store publishing prerequisites when the project is mobile.
 *
 * @param platform - Current OS family.
 * @param env - Merged doctor environment.
 * @param mobile - Whether the project has a mobile surface.
 * @param log - Doctor logger.
 * @returns True when mobile publishing prerequisites are acceptable.
 * @example
 * const ok = verifyMobilePublishing(platform, env, surface.mobile, console);
 */
const verifyMobilePublishing = (
  platform: Platform,
  env: Record<string, string | undefined>,
  mobile: boolean,
  log: Console,
): boolean => {
  if (!mobile) {
    return true;
  }

  const report = verifyMobilePublishReadiness(platform, env, createDefaultCommandProbe(spawnSync));
  writeLines(log, report.lines);
  return report.ok;
};

/**
 * Verify external service probes that can run independently.
 *
 * @param env - Merged doctor environment.
 * @returns Ordered report line groups.
 * @example
 * const reports = await verifyExternalServices(process.env);
 */
const verifyExternalServices = async (
  env: NodeJS.ProcessEnv,
): Promise<readonly (readonly string[])[]> => {
  const [presetReport, namecheapReport, godaddyReport, emailWorkerReport] = await Promise.all([
    verifyPresetsDoctor(env),
    verifyNamecheapDoctor(env),
    verifyGodaddyDoctor(env),
    verifyEmailWorkerDoctor(env),
  ]);

  return [presetReport.lines, namecheapReport.lines, godaddyReport.lines, emailWorkerReport.lines];
};

/**
 * Run Railway-specific follow-up checks when the Railway stack is active.
 *
 * @param env - Merged doctor environment.
 * @param reports - Tool reports.
 * @param log - Doctor logger.
 * @returns Void after report lines are written.
 * @example
 * writeRailwayReport(env, reports, console);
 */
const writeRailwayReport = (
  env: Record<string, string | undefined>,
  reports: readonly ToolReport[],
  log: Console,
): void => {
  if (!isRailwayStackActive(env)) {
    return;
  }
  const railway = reportFor(reports, 'railway');
  const installed = railway?.installed === true;
  const authed = railway === undefined ? null : railway.authed;
  const agentSetup = runRailwayAgentSetup(installed, authed);
  writeLines(log, formatRailwayStackReport(env, agentSetup));
};

/** Platform skills, project health, kit package builds, assets (§8.1), and perf readiness (§8.2). */
const writeProjectLocalReports = (
  cwd: string,
  surface: ReturnType<typeof inferProjectSurfaceSync>,
  log: Console,
): boolean => {
  writeLines(log, formatPlatformSkillsReport(verifyPlatformSkills(cwd)));
  const projectHealth = verifyProjectHealth(cwd);
  writeLines(log, projectHealth.lines);
  const kitHealth = verifyKitWorkspaceHealth(cwd);
  writeLines(log, kitHealth.lines);
  writeLines(log, verifyAssetsPipeline(cwd, surface).lines);
  writeLines(log, verifyPerfReadiness(cwd, surface).lines);
  return projectHealth.ok && kitHealth.ok;
};

/**
 * Ensure Codex skills discovery when Codex is installed.
 *
 * @param reports - Tool reports.
 * @param log - Doctor logger.
 * @returns Promise that resolves after Codex config is checked.
 * @example
 * await ensureCodexSkills(reports, console);
 */
const ensureCodexSkills = async (reports: readonly ToolReport[], log: Console): Promise<void> => {
  const codex = reportFor(reports, 'codex');
  if (codex === undefined || !codex.installed) {
    return;
  }

  const codexSkills = await ensureCodexSkillsEnabled();
  if (codexSkills.updated) {
    log.log('✓ Codex - enabled Agent Skills discovery in ~/.codex/config.toml.');
  } else {
    log.log('✓ Codex - Agent Skills discovery already enabled.');
  }
};

/**
 * Record the inferred report-mode assistant.
 *
 * @param options - Project, surface, reports, Cursor state, and logger.
 * @returns Void after env keys are written when an assistant is inferred.
 * @example
 * writeReportModeAssistant({ cwd, surface, reports, cursorSession: false, log: console });
 */
type ReportModeAssistantOptions = {
  readonly cwd: string;
  readonly surface: ReturnType<typeof inferProjectSurfaceSync>;
  readonly reports: readonly ToolReport[];
  readonly cursorSession: boolean;
  readonly log: Console;
};

const writeReportModeAssistant = (options: ReportModeAssistantOptions): void => {
  const { cursorSession, cwd, log, reports, surface } = options;
  const codex = reportFor(reports, 'codex');
  const assistant = inferVybeAssistant({
    cursorSession,
    claudeInstalled: reportFor(reports, 'claude')?.installed === true,
    codexInstalled: codex?.installed === true,
  });
  if (assistant !== null) {
    writeEnvKeys(cwd, reportModeEnvKeysForSurface(surface, assistant));
    log.log(`✓ Report Mode - your assistant is set to ${assistant}.`);
  }
};

/**
 * Provision and verify the agentic toolchain for the current project.
 *
 * @param log - Logger used for doctor output.
 * @returns Exit code for the doctor command.
 * @example
 * const code = await runDoctor(console);
 */
export const runDoctor = async (log: Console = console): Promise<number> => {
  const platform = toPlatform(process.platform);
  if (platform === null) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return 1;
  }

  const cwd = process.cwd();
  const surface = inferProjectSurfaceSync(cwd);
  const env = mergeEnv(process.env, loadEnvFile(cwd));

  const cursorSession = isCursorSession();
  if (cursorSession) {
    log.log("✓ Cursor - you're in Cursor; no separate agent install needed.");
  }

  const { nativeTools, providerTools, reports } = runToolchain(platform, surface, env, log);
  writeLines(log, formatReport(reports));
  const nativeSetup = runNativeProjectSetup(cwd, surface, platform, log);
  writeLines(log, nativeSetup.lines);

  const mobilePublishOk = verifyMobilePublishing(platform, env, surface.mobile, log);
  for (const lines of await verifyExternalServices(env)) {
    writeLines(log, lines);
  }

  writeRailwayReport(env, reports, log);
  const projectHealthOk = writeProjectLocalReports(cwd, surface, log);

  const skillsReady = isSkillsCliReady(reports);
  const agentExperience = await runAgentExperience(cwd, { skillsCliReady: skillsReady });
  writeLines(log, agentExperience.lines);

  const r2Result = await provisionR2Storage(cwd, env, log);
  log.log(`[doctor] ${r2Result.message}`);
  writeLines(log, formatProductSurfaceHints(env));

  const infraTools = [...providerTools, ...nativeTools];
  const cloudReady = infraTools.every((tool) => reportFor(reports, tool.name)?.installed === true);
  const agentReady = isAgentRuntimeReady(reports) || cursorSession;

  await ensureCodexSkills(reports, log);
  log.log(formatGlobalStatus(await readGlobalStatus()));
  writeReportModeAssistant({ cwd, surface, reports, cursorSession, log });

  return computeDoctorExitCode({
    cloudReady,
    r2Ok: r2Result.ok,
    agentReady,
    skillsReady,
    projectHealthOk,
    mobilePublishOk,
  });
};
