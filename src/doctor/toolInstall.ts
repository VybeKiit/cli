import { MISSING_COMMAND_CODE, runProcess } from '../global/exec';
import { runLoggedProcess, setupLogPath } from '../lib/setupLog';
import type { DoctorLog } from './doctorLog';
import { installGithubRelease, runDownloadedScript } from './downloadInstall';
import {
  type InstallKind,
  type InstallStep,
  isSignedIn,
  meetsMinimumVersion,
  type Platform,
  planInstall,
  type Tool,
  type ToolPresence,
} from './toolchain';
import { npmUserInstallArguments } from './toolFolders';

export type InstallOutcome = {
  readonly ok: boolean;
  readonly missingRequirement?: string;
};

const PROBE_TIMEOUT_MILLISECONDS = 60_000;

export const supportedDoctorPlatform = (nodePlatform: NodeJS.Platform): Platform | null =>
  nodePlatform === 'darwin' || nodePlatform === 'win32' || nodePlatform === 'linux'
    ? nodePlatform
    : null;

export const probeToolPresence = async (tool: Tool): Promise<boolean> => {
  const versionProbe = await runProcess(tool.name, tool.versionArgs, {
    timeout: PROBE_TIMEOUT_MILLISECONDS,
  });
  const versionText = `${versionProbe.stdout}\n${versionProbe.stderr}`;
  return versionProbe.code === 0 && meetsMinimumVersion(versionText, tool.minimumVersion);
};

export const probeToolAuth = async (tool: Tool): Promise<boolean | null> => {
  if (tool.auth === undefined) {
    return null;
  }
  const authProbe = await runProcess(tool.auth.command, tool.auth.args, {
    timeout: PROBE_TIMEOUT_MILLISECONDS,
  });
  return isSignedIn(tool.auth, authProbe);
};

const installNpmPackage = async (packageName: string): Promise<InstallOutcome> => {
  const npmInstallArguments = npmUserInstallArguments(packageName);
  const npmInstall = await runLoggedProcess('npm', npmInstallArguments);
  return { ok: npmInstall.code === 0 };
};

const runInstallCommand = async (commandStep: InstallStep<'command'>): Promise<InstallOutcome> => {
  const commandRun = await runLoggedProcess(commandStep.command, commandStep.args);
  const missingRequirement =
    commandRun.code === MISSING_COMMAND_CODE ? commandStep.requires : undefined;
  return missingRequirement === undefined
    ? { ok: commandRun.code === 0 }
    : { ok: false, missingRequirement };
};

type Installers = {
  readonly [Kind in InstallKind]: (
    installStep: InstallStep<Kind>,
    tool: string,
  ) => Promise<InstallOutcome>;
};

const INSTALLERS: Installers = {
  npm: (npmStep) => installNpmPackage(npmStep.packageName),
  release: async (releaseStep, tool) => ({ ok: await installGithubRelease(tool, releaseStep) }),
  script: async (scriptStep, tool) => ({ ok: await runDownloadedScript(tool, scriptStep.url) }),
  command: runInstallCommand,
};

const runInstallStep = <Kind extends InstallKind>(
  installStep: InstallStep<Kind>,
  tool: string,
): Promise<InstallOutcome> => INSTALLERS[installStep.kind](installStep, tool);

const installAndVerify = async (
  tool: Tool,
  installStep: InstallStep,
  log: DoctorLog,
): Promise<InstallOutcome> => {
  log.log(`Installing ${tool.name}...`);
  const outcome = await runInstallStep(installStep, tool.name);
  const installed = outcome.ok && (await probeToolPresence(tool));
  if (!installed) {
    log.log(`Could not install ${tool.name}. Details are in ${setupLogPath()}`);
  }
  return { ...outcome, ok: installed };
};

export const installMissingTools = async (
  platform: Platform,
  tools: readonly Tool[],
  presence: readonly ToolPresence[],
  log: DoctorLog,
): Promise<ReadonlyMap<string, InstallOutcome>> =>
  await planInstall(platform, presence, tools).reduce(async (earlierInstalls, installAction) => {
    const installs = await earlierInstalls;
    const tool = tools.find((candidate) => candidate.name === installAction.tool);
    if (tool === undefined) {
      return installs;
    }
    const outcome = await installAndVerify(tool, installAction, log);
    return installs.set(tool.name, outcome);
  }, Promise.resolve(new Map<string, InstallOutcome>()));

export const probeToolsPresence = async (tools: readonly Tool[]): Promise<ToolPresence[]> =>
  await Promise.all(
    tools.map(async (tool) => ({ tool: tool.name, present: await probeToolPresence(tool) })),
  );
