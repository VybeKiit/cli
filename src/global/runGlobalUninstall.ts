import { existsSync } from 'node:fs';
import { lstat, readdir, readFile, readlink, rm, rmdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { confirm, isCancel } from '@clack/prompts';
import { Cause, Data, Effect, Either, Exit, Option, Schema } from 'effect';
import {
  AgentInstallationSettings,
  agentInstructionPaths,
  agentSkillLinkDirectories,
  removeAgentInstruction,
} from './agentGuidance';
import { STATUSLINE_BADGE, withoutStatusLineBadge } from './awareness';
import { type ExecFn, makeExec } from './exec';
import { globalInstallPaths } from './globalPaths';
import { GLOBAL_MCP_SERVERS, mcpRegistrationOwner } from './installGlobalMcp';
import { installStatePath, readInstallState } from './installState';
import { listManagedSkillNames } from './managedSkills';

export class GlobalUninstallError extends Data.TaggedError('GlobalUninstallError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const REMOVAL_GROUPS = {
  mcp: 'Claude Code tool connections',
  skillLinks: 'Skill links for your other coding assistants',
  skills: 'Skills',
  instructions: 'VybeKiit instructions in your coding assistants',
  instructionBackups: 'Backup copies of those instructions',
  command: 'The /vybekiit command',
  statusLine: 'The ◆ vybekiit status badge',
  guide: 'VybeKiit guide files',
  installStamp: 'Setup stamp',
};

const GUIDE_FILES = ['agent-guidance.md', 'language.md', 'agents.json', 'feedback-consent.json'];

type GlobalRemoval =
  | { readonly kind: 'path'; readonly group: string; readonly path: string }
  | { readonly kind: 'emptyDirectory'; readonly group: string; readonly path: string }
  | {
      readonly kind: 'rewrite';
      readonly group: string;
      readonly path: string;
      readonly remainingText: string;
    }
  | { readonly kind: 'mcp'; readonly group: string; readonly name: string };

export type GlobalUninstallPlan = {
  readonly removals: readonly GlobalRemoval[];
  readonly keptNotes: readonly string[];
  readonly repairNotes: readonly string[];
};

const pathRemoval = (group: string, path: string): GlobalRemoval => ({ kind: 'path', group, path });

const mcpRemoval = (name: string): GlobalRemoval => ({
  kind: 'mcp',
  group: REMOVAL_GROUPS.mcp,
  name,
});

const uninstallPlan = (
  removals: readonly GlobalRemoval[],
  keptNotes: readonly string[] = [],
  repairNotes: readonly string[] = [],
): GlobalUninstallPlan => ({ removals, keptNotes, repairNotes });

const combinedPlan = (plans: readonly GlobalUninstallPlan[]): GlobalUninstallPlan =>
  uninstallPlan(
    plans.flatMap((plan) => plan.removals),
    plans.flatMap((plan) => plan.keptNotes),
    plans.flatMap((plan) => plan.repairNotes),
  );

const readOptionalText = (path: string) =>
  Effect.tryPromise({
    try: async () =>
      existsSync(path) ? Option.some(await readFile(path, 'utf8')) : Option.none<string>(),
    catch: (cause) => new GlobalUninstallError({ message: `Could not read ${path}.`, cause }),
  });

const readDirectoryNames = (directory: string) =>
  Effect.tryPromise({
    try: async () => (existsSync(directory) ? await readdir(directory) : []),
    catch: (cause) => new GlobalUninstallError({ message: `Could not read ${directory}.`, cause }),
  });

const planMcpRemovals = (claude: ExecFn) =>
  Effect.gen(function* () {
    const claudeVersion = yield* Effect.promise(() => claude(['--version']));
    if (claudeVersion.code === 127) {
      return uninstallPlan(
        [],
        ['Claude Code tool connections, because Claude Code is not installed.'],
      );
    }
    const registrations = yield* Effect.all(
      GLOBAL_MCP_SERVERS.map((mcpServer) =>
        Effect.promise(() => claude(['mcp', 'get', mcpServer.name])).pipe(
          Effect.map((registeredServer) => ({
            name: mcpServer.name,
            owner:
              registeredServer.code === 0
                ? mcpRegistrationOwner(mcpServer, registeredServer.stdout)
                : 'absent',
          })),
        ),
      ),
      { concurrency: 4 },
    );
    return uninstallPlan(
      registrations
        .filter((registration) => registration.owner === 'vybekiit')
        .map((registration) => mcpRemoval(registration.name)),
      registrations
        .filter((registration) => registration.owner === 'user')
        .map((registration) => `Your own ${registration.name} tool connection in Claude Code.`),
    );
  });

const planSkillLinkRemovals = (
  skillLinksDirectory: string,
  claudeSkillsDirectory: string,
  managedSkills: readonly string[],
) =>
  Effect.gen(function* () {
    const linkedSkillNames = yield* readDirectoryNames(skillLinksDirectory);
    const managedLinks = yield* Effect.all(
      linkedSkillNames
        .filter((skillName) => managedSkills.includes(skillName))
        .map((skillName) =>
          Effect.tryPromise({
            try: async () => {
              const skillLink = join(skillLinksDirectory, skillName);
              if (!(await lstat(skillLink)).isSymbolicLink()) {
                return Option.none<string>();
              }
              const linkTarget = resolve(skillLinksDirectory, await readlink(skillLink));
              return linkTarget === resolve(claudeSkillsDirectory, skillName)
                ? Option.some(skillLink)
                : Option.none<string>();
            },
            catch: (cause) =>
              new GlobalUninstallError({
                message: `Could not check the ${skillName} skill link in ${skillLinksDirectory}.`,
                cause,
              }),
          }),
        ),
      { concurrency: 16 },
    );
    return uninstallPlan(
      managedLinks
        .flatMap(Option.toArray)
        .map((skillLink) => pathRemoval(REMOVAL_GROUPS.skillLinks, skillLink)),
    );
  });

const planInstructionRemoval = (instructionPath: string) =>
  Effect.gen(function* () {
    const installedInstruction = yield* readOptionalText(instructionPath);
    if (Option.isNone(installedInstruction)) {
      return uninstallPlan([]);
    }
    const userInstruction = yield* Effect.either(
      Effect.try(() => removeAgentInstruction(installedInstruction.value)),
    );
    if (Either.isLeft(userInstruction)) {
      return uninstallPlan(
        [],
        [],
        [`Remove the VybeKiit section from ${instructionPath} by hand, then run this again.`],
      );
    }
    if (userInstruction.right === installedInstruction.value) {
      return uninstallPlan([]);
    }
    const instructionRemoval: GlobalRemoval =
      userInstruction.right.trim() === ''
        ? pathRemoval(REMOVAL_GROUPS.instructions, instructionPath)
        : {
            kind: 'rewrite',
            group: REMOVAL_GROUPS.instructions,
            path: instructionPath,
            remainingText: userInstruction.right,
          };
    const backupPath = `${instructionPath}.vybekiit-backup`;
    const backupInstruction = yield* readOptionalText(backupPath);
    if (Option.isNone(backupInstruction)) {
      return uninstallPlan([instructionRemoval]);
    }
    if (backupInstruction.value.trimEnd() !== userInstruction.right.trimEnd()) {
      return uninstallPlan(
        [instructionRemoval],
        [`Your earlier copy at ${backupPath}, because it differs from ${instructionPath}.`],
      );
    }
    return uninstallPlan([
      instructionRemoval,
      pathRemoval(REMOVAL_GROUPS.instructionBackups, backupPath),
    ]);
  });

const planStatusLineRemoval = (settingsFile: string) =>
  Effect.gen(function* () {
    const claudeSettingsText = yield* readOptionalText(settingsFile);
    if (Option.isNone(claudeSettingsText)) {
      return uninstallPlan([]);
    }
    const settingsWithoutBadge = withoutStatusLineBadge(claudeSettingsText.value);
    if (Option.isSome(settingsWithoutBadge)) {
      return uninstallPlan([
        {
          kind: 'rewrite',
          group: REMOVAL_GROUPS.statusLine,
          path: settingsFile,
          remainingText: settingsWithoutBadge.value,
        },
      ]);
    }
    if (claudeSettingsText.value.includes(STATUSLINE_BADGE)) {
      return uninstallPlan(
        [],
        [],
        [`Remove "${STATUSLINE_BADGE}" from the status line in ${settingsFile} by hand.`],
      );
    }
    return uninstallPlan([]);
  });

const planGuideRemoval = (guideDirectory: string) =>
  Effect.gen(function* () {
    const guideEntries = yield* readDirectoryNames(guideDirectory);
    const otherEntries = guideEntries.filter((fileName) => !GUIDE_FILES.includes(fileName));
    const guideRemovals = guideEntries
      .filter((fileName) => GUIDE_FILES.includes(fileName))
      .map((fileName) => pathRemoval(REMOVAL_GROUPS.guide, join(guideDirectory, fileName)));
    if (otherEntries.length > 0) {
      return uninstallPlan(guideRemovals, [
        `Your other files in ${guideDirectory}: ${otherEntries.join(', ')}.`,
      ]);
    }
    if (!existsSync(guideDirectory)) {
      return uninstallPlan([]);
    }
    return uninstallPlan([
      ...guideRemovals,
      { kind: 'emptyDirectory', group: REMOVAL_GROUPS.guide, path: guideDirectory },
    ]);
  });

const planInstallStampRemoval = (claudeDirectory: string) =>
  Effect.gen(function* () {
    const previousSetup = yield* Effect.promise(() => readInstallState(claudeDirectory));
    const installStampPath = installStatePath(claudeDirectory);
    const firstAppPath = previousSetup?.firstAppPath ?? '';
    const appNotes =
      firstAppPath === ''
        ? []
        : [`Your app at ${firstAppPath}. Delete that folder yourself if you no longer want it.`];
    const installStampRemovals = existsSync(installStampPath)
      ? [pathRemoval(REMOVAL_GROUPS.installStamp, installStampPath)]
      : [];
    return uninstallPlan(installStampRemovals, appNotes);
  });

/** Everything `vybekiit setup` / `global-install` left on this computer that can be removed. */
export const planGlobalUninstall = (
  settings: Schema.Schema.Type<typeof AgentInstallationSettings>,
  claude: ExecFn,
) =>
  Effect.gen(function* () {
    const paths = globalInstallPaths(settings.claudeDirectory);
    const managedSkills = yield* Effect.promise(() => listManagedSkillNames(paths.skillsDir));
    const commandPath = join(paths.commandsDir, 'vybekiit.md');
    const mcpPlan = yield* planMcpRemovals(claude);
    const skillLinkPlans = yield* Effect.all(
      agentSkillLinkDirectories(settings).map((directory) =>
        planSkillLinkRemovals(directory, paths.skillsDir, managedSkills),
      ),
    );
    const instructionPlans = yield* Effect.all(
      agentInstructionPaths(settings).map(planInstructionRemoval),
    );
    const statusLinePlan = yield* planStatusLineRemoval(paths.settingsFile);
    const guidePlan = yield* planGuideRemoval(join(settings.homeDirectory, '.vybekiit'));
    const installStampPlan = yield* planInstallStampRemoval(paths.configDir);
    return combinedPlan([
      mcpPlan,
      ...skillLinkPlans,
      uninstallPlan(
        managedSkills.map((skillName) =>
          pathRemoval(REMOVAL_GROUPS.skills, join(paths.skillsDir, skillName)),
        ),
      ),
      ...instructionPlans,
      uninstallPlan(
        existsSync(commandPath) ? [pathRemoval(REMOVAL_GROUPS.command, commandPath)] : [],
      ),
      statusLinePlan,
      guidePlan,
      installStampPlan,
    ]);
  });

const applyRemoval = (removal: GlobalRemoval, claude: ExecFn) => {
  if (removal.kind === 'mcp') {
    return Effect.promise(() => claude(['mcp', 'remove', '-s', 'user', removal.name])).pipe(
      Effect.flatMap((mcpRemoval) =>
        mcpRemoval.code === 0
          ? Effect.void
          : Effect.fail(
              new GlobalUninstallError({
                message: `Could not remove the ${removal.name} tool connection from Claude Code.`,
              }),
            ),
      ),
    );
  }
  return Effect.tryPromise({
    try: async () => {
      if (removal.kind === 'rewrite') {
        await writeFile(removal.path, removal.remainingText, 'utf8');
        return;
      }
      if (removal.kind === 'emptyDirectory') {
        await rmdir(removal.path);
        return;
      }
      await rm(removal.path, { recursive: true, force: true });
    },
    catch: (cause) =>
      new GlobalUninstallError({ message: `Could not remove ${removal.path}.`, cause }),
  });
};

/** Apply a plan in order; returns the plain-language failures (empty when everything went). */
export const applyGlobalUninstall = (plan: GlobalUninstallPlan, claude: ExecFn) =>
  Effect.all(plan.removals.map((removal) => Effect.either(applyRemoval(removal, claude)))).pipe(
    Effect.map((attempts) =>
      attempts.flatMap((attempt) => (Either.isLeft(attempt) ? [attempt.left.message] : [])),
    ),
  );

const removalSubject = (removal: GlobalRemoval) =>
  removal.kind === 'mcp' ? removal.name : removal.path;

export const formatUninstallPlan = (plan: GlobalUninstallPlan): string[] =>
  [...new Set(plan.removals.map((removal) => removal.group))].map((group) => {
    const subjects = plan.removals.filter((removal) => removal.group === group).map(removalSubject);
    const listedSubjects = subjects.length <= 3 ? `: ${subjects.join(', ')}` : '';
    return `  • ${group} (${subjects.length})${listedSubjects}`;
  });

const noteLines = (heading: string, notes: readonly string[]) =>
  notes.length === 0 ? [] : [heading, ...notes.map((note) => `  • ${note}`)];

const printLines = (lines: readonly string[]) =>
  Effect.sync(() => process.stdout.write(`${lines.join('\n')}\n`));

/**
 * `vybekiit uninstall [--yes] [--dry-run]`: remove the skills, assistant instructions, Claude
 * Code tool connections, and files global setup added. Buyer apps and the CLI itself stay.
 */
export const runGlobalUninstall = async (
  commandArguments: readonly string[],
  interactiveTerminal: boolean,
  claude: ExecFn = makeExec('claude'),
): Promise<number> => {
  const confirmedUpfront = commandArguments.includes('--yes') || commandArguments.includes('-y');
  const dryRun = commandArguments.includes('--dry-run');
  const paths = globalInstallPaths();
  const settings = Schema.decodeUnknownSync(AgentInstallationSettings)({
    homeDirectory: homedir(),
    claudeDirectory: paths.configDir,
    codexDirectory: process.env.CODEX_HOME || join(homedir(), '.codex'),
    executablePath: '',
    plainLanguageGuide: paths.bundledLanguageGuide,
  });
  const uninstallProgram = Effect.gen(function* () {
    const plan = yield* planGlobalUninstall(settings, claude);
    const keptLines = noteLines('Not removed:', plan.keptNotes);
    const repairLines = noteLines('Needs your attention:', plan.repairNotes);
    const needsRepair = plan.repairNotes.length > 0;
    if (plan.removals.length === 0) {
      yield* printLines([
        'VybeKiit is not set up on this computer. Nothing to remove.',
        ...keptLines,
        ...repairLines,
      ]);
      return needsRepair ? 1 : 0;
    }
    yield* printLines(['', 'VybeKiit will remove:', ...formatUninstallPlan(plan), '']);
    if (dryRun) {
      yield* printLines(['Dry run: nothing was removed.', ...keptLines, ...repairLines]);
      return 0;
    }
    if (!(confirmedUpfront || interactiveTerminal)) {
      yield* printLines([
        'Nothing was removed. Run `npx vybekiit uninstall --yes` to remove everything above.',
      ]);
      return 0;
    }
    if (!confirmedUpfront) {
      const removalApproved = yield* Effect.promise(() =>
        confirm({ message: 'Remove VybeKiit from this computer?', initialValue: false }),
      );
      if (isCancel(removalApproved) || removalApproved !== true) {
        yield* printLines(['Nothing was removed.']);
        return 0;
      }
    }
    const failures = yield* applyGlobalUninstall(plan, claude);
    const headline =
      failures.length === 0
        ? '✅ VybeKiit was removed from this computer.'
        : '✗ VybeKiit was only partly removed.';
    yield* printLines([
      headline,
      ...noteLines('Could not finish:', failures),
      ...keptLines,
      ...repairLines,
      '',
      'Start a fresh session in your coding assistant so it stops loading VybeKiit.',
      'If you installed the vybekiit command itself, remove it with: npm uninstall -g vybekiit',
    ]);
    return failures.length > 0 || needsRepair ? 1 : 0;
  });
  const uninstallExit = await Effect.runPromiseExit(uninstallProgram);
  if (Exit.isSuccess(uninstallExit)) {
    return uninstallExit.value;
  }
  const planFailure = Option.match(Cause.failureOption(uninstallExit.cause), {
    onNone: () => '',
    onSome: (uninstallFailure) => ` ${uninstallFailure.message}`,
  });
  process.stderr.write(
    `VybeKiit could not check what it installed, so nothing was removed.${planFailure} Run \`npx vybekiit uninstall\` again.\n`,
  );
  return 1;
};
