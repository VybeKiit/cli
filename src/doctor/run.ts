import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { inferVybeAssistant } from '@vybekiit/report-mode';
import { inferProjectSurfaceSync, reportModeEnvKeysForSurface } from '../lib/inferProjectSurface';
import { runAgentExperience } from './agentExperience';
import { verifyAssetsPipeline } from './assetsValidate';
import { formatGlobalStatus, isGloballyInstalled, readGlobalStatus } from './claudeGlobalConfig';
import { ensureCodexSkillsEnabled } from './codexConfig';
import { type DoctorLog, processDoctorLog, writeDoctorLines } from './doctorLog';
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

/** Node OS family doctor can install on, or null when unsupported. */
const supportedDoctorPlatform = (nodePlatform: NodeJS.Platform): Platform | null =>
  nodePlatform === 'darwin' || nodePlatform === 'win32' || nodePlatform === 'linux'
    ? nodePlatform
    : null;

/** True when Cursor session env markers are present. */
const isCursorSession = (): boolean =>
  Boolean(process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID);

/** True when the command exits with status zero. */
const succeeds = (command: string, spawnArgs: readonly string[]): boolean =>
  spawnSync(command, [...spawnArgs], { stdio: 'ignore' }).status === 0;

type InstallOutcome = {
  readonly ok: boolean;
  readonly missingRequirement?: string;
};

/** Node spawn error code when present. */
const errorCode = (spawnError: Error | undefined): string | undefined =>
  spawnError !== undefined && 'code' in spawnError && typeof spawnError.code === 'string'
    ? spawnError.code
    : undefined;

/** Run one planned install command. */
const runInstall = (action: InstallAction, log: DoctorLog): InstallOutcome => {
  log.log(`[doctor] setting up ${action.tool}: ${action.command} ${action.args.join(' ')}`);
  const installProcess = spawnSync(action.command, [...action.args], { stdio: 'inherit' });
  if (errorCode(installProcess.error) === 'ENOENT') {
    return action.requires ? { ok: false, missingRequirement: action.requires } : { ok: false };
  }
  return { ok: installProcess.status === 0 };
};

/** Final tool report after presence probe and optional install. */
const toolReportAfterInstall = (
  tool: Tool,
  presence: readonly ToolPresence[],
  installs: ReadonlyMap<string, InstallOutcome>,
): ToolReport => {
  const observedPresence = presence.find((presenceRow) => presenceRow.tool === tool.name);
  const wasPresent = observedPresence === undefined ? false : observedPresence.present;
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

/** Probe and install the selected toolchain; return tools and final reports. */
const runToolchain = (
  platform: Platform,
  surface: ReturnType<typeof inferProjectSurfaceSync>,
  processEnv: Record<string, string | undefined>,
  log: DoctorLog,
): DoctorToolRun => {
  const providerTools = selectToolchain(processEnv, {
    mobile: surface.mobile,
    wantsGoogleAuth: Boolean(processEnv.GOOGLE_OAUTH_CLIENT_ID),
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
    reports: toolchain.map((tool) => toolReportAfterInstall(tool, presence, installs)),
  };
};

/** Mobile store publish gates when the project has a mobile surface. */
const verifyMobilePublishing = (
  platform: Platform,
  processEnv: Record<string, string | undefined>,
  mobile: boolean,
  log: DoctorLog,
): boolean => {
  if (!mobile) {
    return true;
  }

  const report = verifyMobilePublishReadiness(
    platform,
    processEnv,
    createDefaultCommandProbe(spawnSync),
  );
  writeDoctorLines(log, report.lines);
  return report.ok;
};

/** Independent external-service probe line groups (presets, registrars, email worker). */
const verifyExternalServices = async (
  processEnv: NodeJS.ProcessEnv,
): Promise<readonly (readonly string[])[]> => {
  const [presetReport, namecheapReport, godaddyReport, emailWorkerReport] = await Promise.all([
    verifyPresetsDoctor(processEnv),
    verifyNamecheapDoctor(processEnv),
    verifyGodaddyDoctor(processEnv),
    verifyEmailWorkerDoctor(processEnv),
  ]);

  return [presetReport.lines, namecheapReport.lines, godaddyReport.lines, emailWorkerReport.lines];
};

/** Railway stack coupling + agent setup lines when Railway is active. */
const writeRailwayReport = (
  processEnv: Record<string, string | undefined>,
  reports: readonly ToolReport[],
  log: DoctorLog,
): void => {
  if (!isRailwayStackActive(processEnv)) {
    return;
  }
  const railway = reportFor(reports, 'railway');
  const installed = railway?.installed === true;
  const authed = railway === undefined ? null : railway.authed;
  const agentSetup = runRailwayAgentSetup(installed, authed);
  writeDoctorLines(log, formatRailwayStackReport(processEnv, agentSetup));
};

/** Platform skills, project health, kit package builds, assets (§8.1), and perf readiness (§8.2). */
const writeProjectLocalReports = (
  cwd: string,
  surface: ReturnType<typeof inferProjectSurfaceSync>,
  log: DoctorLog,
): boolean => {
  writeDoctorLines(log, formatPlatformSkillsReport(verifyPlatformSkills(cwd)));
  const projectHealth = verifyProjectHealth(cwd);
  writeDoctorLines(log, projectHealth.lines);
  const kitHealth = verifyKitWorkspaceHealth(cwd);
  writeDoctorLines(log, kitHealth.lines);
  writeDoctorLines(log, verifyAssetsPipeline(cwd, surface).lines);
  writeDoctorLines(log, verifyPerfReadiness(cwd, surface).lines);
  return projectHealth.ok && kitHealth.ok;
};

/** Enable Codex Agent Skills discovery when Codex is installed. */
const ensureCodexSkills = async (reports: readonly ToolReport[], log: DoctorLog): Promise<void> => {
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

type ReportModeAssistantOptions = {
  readonly cwd: string;
  readonly surface: ReturnType<typeof inferProjectSurfaceSync>;
  readonly reports: readonly ToolReport[];
  readonly cursorSession: boolean;
  readonly log: DoctorLog;
};

/** Persist inferred report-mode assistant into project env when one is detected. */
const writeReportModeAssistant = (assistantWrite: ReportModeAssistantOptions): void => {
  const { cursorSession, cwd, log, reports, surface } = assistantWrite;
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

/** Provision and verify the agentic toolchain for the current project. */
export const runDoctor = async (log: DoctorLog = processDoctorLog): Promise<number> => {
  const platform = supportedDoctorPlatform(process.platform);
  if (platform === null) {
    log.error(`[doctor] This operating system (${process.platform}) isn't supported yet.`);
    return 1;
  }

  const cwd = process.cwd();
  const surface = inferProjectSurfaceSync(cwd);
  const processEnv = mergeEnv(process.env, loadEnvFile(cwd));

  const cursorSession = isCursorSession();
  if (cursorSession) {
    log.log("✓ Cursor - you're in Cursor; no separate agent install needed.");
  }

  const { nativeTools, providerTools, reports } = runToolchain(platform, surface, processEnv, log);
  writeDoctorLines(log, formatReport(reports));
  const nativeSetup = runNativeProjectSetup(cwd, surface, platform, log);
  writeDoctorLines(log, nativeSetup.lines);

  const mobilePublishOk = verifyMobilePublishing(platform, processEnv, surface.mobile, log);
  for (const lines of await verifyExternalServices(processEnv)) {
    writeDoctorLines(log, lines);
  }

  writeRailwayReport(processEnv, reports, log);
  const projectHealthOk = writeProjectLocalReports(cwd, surface, log);

  const skillsReady = isSkillsCliReady(reports);
  const agentExperience = await runAgentExperience(cwd, { skillsCliReady: skillsReady });
  writeDoctorLines(log, agentExperience.lines);

  const r2Provision = await provisionR2Storage(cwd, processEnv, log);
  log.log(`[doctor] ${r2Provision.message}`);
  writeDoctorLines(log, formatProductSurfaceHints(processEnv));

  const infraTools = [...providerTools, ...nativeTools];
  const cloudReady = infraTools.every((tool) => reportFor(reports, tool.name)?.installed === true);
  const agentReady = isAgentRuntimeReady(reports) || cursorSession;

  await ensureCodexSkills(reports, log);
  const globalStatus = await readGlobalStatus();
  log.log(formatGlobalStatus(globalStatus));
  writeReportModeAssistant({ cwd, surface, reports, cursorSession, log });

  return computeDoctorExitCode({
    cloudReady,
    r2Ok: r2Provision.ok,
    agentReady,
    skillsReady,
    projectHealthOk,
    mobilePublishOk,
    // Hard-fail when zero managed skills: a skipped/failed global-install used to only print
    // a soft arrow and still exit 0, so Claude never loaded kit skills and nobody noticed.
    globalClaudeOk: isGloballyInstalled(globalStatus),
  });
};
