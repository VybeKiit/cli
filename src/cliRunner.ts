import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CLI_HELP, CLI_HELP_ALL } from './cliHelp';
import { runAddBridge } from './commands/addBridge';
import {
  runBackendAddCrud,
  runBackendAddRoute,
  runBackendAddUpload,
  runBackendGenContract,
  runScaffoldBackend,
} from './commands/backendCli';
import { runCheckAgentLayer } from './commands/checkAgentLayer';
import { runCheckGoals } from './commands/checkGoals';
import { runCreateApp } from './commands/createApp';
import { isUiLibraryCreateArgs, runCreateUiLibraryCommand } from './commands/createUiLibrary';
import { runDedup } from './commands/dedup';
import { runDocFallback } from './commands/docFallback';
import { runDrop } from './commands/drop';
import { runFeedback } from './commands/feedbackCmd';
import { runInit } from './commands/init';
import { runLintExtensionSkill } from './commands/lintExtensionSkill';
import { runLiveWorkData } from './commands/liveWorkDataCmd';
import { runLiveWorkHost } from './commands/liveWorkHostCmd';
import { runLiveWorkPayments } from './commands/liveWorkPaymentsCmd';
import { runLocalDev } from './commands/localDev';
import { runNew } from './commands/new';
import { runAddPageRecipe, runListPageRecipes, runListPieces } from './commands/piecesCmd';
import { runAddPiecesInteractive } from './commands/piecesInteractive';
import { runPlanDataModel } from './commands/planDataModelCmd';
import { runPlanReadiness } from './commands/planReadiness';
import { runPlanSetup } from './commands/planSetupCmd';
import { runApplyPreset, runListPresets, runVerifyPresets } from './commands/presetsCmd';
import { runRenderAgentLayer } from './commands/renderAgentLayer';
import { runAddReportMode } from './commands/reportModeCmd';
import { runSetup } from './commands/setup';
import { runSyncAgentLayer } from './commands/syncAgentLayer';
import { runUpdateKitCommand } from './commands/updateKit';
import { ensureTool, formatEnsureStatus } from './doctor/ensureTool';
import { ensureAccessOrExit } from './doctor/gate';
import { runDoctor } from './doctor/run';
import { runGlobalInstall } from './global/runGlobalInstall';
import { runEnvWizard } from './prompts/envWizard';
import type { MainMenuChoice } from './prompts/mainMenu';
import { promptMainMenu } from './prompts/mainMenu';
import { isInteractive } from './prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Commands that may run before license gate (first-run tools path). */
const GATE_EXEMPT = new Set(['doctor', 'setup', 'global-install', 'update', 'feedback']);

/**
 * Parsed argv for one CLI invocation.
 *
 * `noun` is the first token after the top-level verb when present (`app` in
 * `create app`, `data` in `live-work data`). Flat verbs fold every remaining
 * token into {@link verbArgs} — never drop the first positional.
 */
type CliInvocation = {
  readonly verb: string;
  readonly noun: string | undefined;
  readonly rest: readonly string[];
};

type CliCommand = (invocation: CliInvocation) => Promise<number> | number;

/**
 * Read the CLI's own version from its package.json.
 *
 * @returns Package version string.
 */
const readVersion = async (): Promise<string> => {
  try {
    const raw = await readFile(join(HERE, '..', 'package.json'), 'utf8');
    const parsed = JSON.parse(raw) as { readonly version?: string };
    if (parsed.version !== undefined && parsed.version !== '') {
      return parsed.version;
    }
    return '0.0.0';
  } catch {
    return '0.0.0';
  }
};

/**
 * Parse raw argv into verb, optional noun, and remaining arguments.
 *
 * @param argv - Process arguments after the binary name.
 * @returns Parsed invocation, or null when no verb was provided.
 */
const parseInvocation = (argv: readonly string[]): CliInvocation | null => {
  const [verb, noun, ...rest] = argv;
  if (verb === undefined || verb === '') {
    return null;
  }
  return { verb, noun, rest };
};

/**
 * Full argument list after the top-level verb (noun restored when present).
 *
 * Flat commands must use this — using `rest` alone drops the first positional
 * (`plan-setup payments` would become `[]` and always fail).
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Arguments with noun restored when present.
 */
const verbArgs = (invocation: CliInvocation): string[] => {
  if (invocation.noun !== undefined) {
    return [invocation.noun, ...invocation.rest];
  }
  return [...invocation.rest];
};

/** Write structured command JSON (or text) once and return its exit code. */
const writeJsonResult = (result: { readonly json: string; readonly exitCode: number }): number => {
  process.stdout.write(`${result.json}\n`);
  return result.exitCode;
};

/** Write plain message result once and return its exit code. */
const writeMessageResult = (result: {
  readonly message: string;
  readonly exitCode: number;
}): number => {
  process.stdout.write(`${result.message}\n`);
  return result.exitCode;
};

/** Write line-oriented result once and return its exit code. */
const writeLinesResult = (result: {
  readonly lines: readonly string[];
  readonly exitCode: number;
}): number => {
  if (result.lines.length > 0) {
    process.stdout.write(`${result.lines.join('\n')}\n`);
  }
  return result.exitCode;
};

/**
 * Resolve the `doctor --ensure` tool name from inline or following argument syntax.
 *
 * @param args - Doctor command arguments.
 * @param ensureArg - Matched ensure argument.
 * @returns Tool name, or undefined when the command is incomplete.
 */
const ensureToolDisplayName = (args: readonly string[], ensureArg: string): string | undefined => {
  if (ensureArg.includes('=')) {
    const [, inline] = ensureArg.split('=');
    return inline;
  }

  const ensureIndex = args.indexOf(ensureArg);
  return args[ensureIndex + 1];
};

/**
 * Run `vybekiit doctor --ensure <tool> [--json]`.
 *
 * @param toolName - Tool name requested by the caller.
 * @param json - Whether to print machine-readable JSON.
 * @returns Exit code for the single-tool preflight.
 */
const runDoctorEnsure = (toolName: string | undefined, json: boolean): number => {
  if (toolName === undefined || toolName === '' || toolName.startsWith('--')) {
    const message = 'Usage: vybekiit doctor --ensure <tool> [--json]';
    if (json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`);
    } else {
      process.stderr.write(`${message}\n`);
    }
    return 1;
  }

  const ensureStatus = ensureTool(toolName);
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: ensureStatus.installed, ...ensureStatus })}\n`);
  } else {
    process.stdout.write(`${formatEnsureStatus(ensureStatus)}\n`);
  }
  return ensureStatus.installed ? 0 : 1;
};

/**
 * Run doctor command variants.
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Exit code for doctor.
 */
const handleDoctorCommand = async (invocation: CliInvocation): Promise<number> => {
  const args = verbArgs(invocation);
  const ensureArg = args.find((arg) => arg === '--ensure' || arg.startsWith('--ensure='));
  if (ensureArg === undefined) {
    return await runDoctor();
  }

  return runDoctorEnsure(ensureToolDisplayName(args, ensureArg), args.includes('--json'));
};

/**
 * Run backend command variants.
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Exit code for backend commands.
 */
const handleBackendCommand = async (invocation: CliInvocation): Promise<number> => {
  if (invocation.noun === 'add-route') {
    return writeMessageResult(await runBackendAddRoute([...invocation.rest]));
  }
  if (invocation.noun === 'add-crud') {
    return writeMessageResult(await runBackendAddCrud([...invocation.rest]));
  }
  if (invocation.noun === 'add-upload') {
    return writeMessageResult(await runBackendAddUpload());
  }
  if (invocation.noun === 'gen-contract') {
    return writeMessageResult(await runBackendGenContract());
  }
  process.stderr.write(
    'Unknown backend command. Try: backend add-route | add-crud | add-upload | gen-contract\n',
  );
  return 1;
};

/**
 * Run env command variants.
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Exit code for env commands.
 */
const handleEnvCommand = async (invocation: CliInvocation): Promise<number> => {
  if (invocation.noun !== 'wizard') {
    process.stderr.write('Unknown env command. Try: vybekiit env wizard\n');
    return 1;
  }
  if (!isInteractive()) {
    process.stderr.write('env wizard requires an interactive terminal.\n');
    return 1;
  }
  return await runEnvWizard();
};

/**
 * Run `create` subcommands (`create app …` or `create --ui-library`).
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Exit code for create.
 */
const handleCreateCommand = async (invocation: CliInvocation): Promise<number> => {
  const args = verbArgs(invocation);
  if (isUiLibraryCreateArgs(args)) {
    return await runCreateUiLibraryCommand(args);
  }
  if (invocation.noun !== 'app') {
    process.stderr.write(
      'Usage: vybekiit create app --web|--mobile|--extension [directory]\n' +
        '   or: vybekiit create --ui-library [directory]\n',
    );
    return 1;
  }
  return await runCreateApp([...invocation.rest]);
};

/**
 * Whether help should print the full agent verb list.
 *
 * @param argv - Full argv after the binary name.
 * @returns True when `--all` is present with help.
 */
const wantsFullHelp = (argv: readonly string[]): boolean =>
  argv.includes('--all') || argv.includes('-a');

/**
 * Dispatch a bare interactive menu choice to the same handlers as flags.
 *
 * @param choice - Main menu selection.
 * @returns Exit code from the chosen path.
 */
const runMainMenuChoice = async (choice: MainMenuChoice): Promise<number> => {
  if (choice === 'help-all') {
    process.stdout.write(`${CLI_HELP_ALL}\n`);
    return 0;
  }
  if (choice === 'setup') {
    return await runSetup();
  }
  if (choice === 'doctor') {
    return await runDoctor();
  }
  // create / add-piece — still need license gate
  if (!ensureAccessOrExit()) {
    return 1;
  }
  if (choice === 'add-piece') {
    return await runAddPiecesInteractive();
  }
  return await runCreateApp([]);
};

/**
 * Handle `vybekiit add …` (bridge, page-recipe, or interactive picker).
 *
 * @param invocation - Parsed CLI invocation.
 * @returns Exit code for the add path.
 */
const handleAddCommand = async (invocation: CliInvocation): Promise<number> => {
  if (invocation.noun === undefined) {
    return await runAddPiecesInteractive();
  }
  if (invocation.noun === 'bridge') {
    return await runAddBridge([...invocation.rest]);
  }
  if (invocation.noun === 'page-recipe') {
    return writeJsonResult(await runAddPageRecipe([...invocation.rest]));
  }
  if (invocation.noun === 'report-mode') {
    return writeJsonResult(await runAddReportMode([...invocation.rest]));
  }
  if (invocation.noun === 'preset') {
    // Alias so agents can use one verb family: add preset | add page-recipe
    return writeJsonResult(await runApplyPreset([...invocation.rest]));
  }
  process.stderr.write(
    'Unknown add command. Try: vybekiit add page-recipe <id> | add report-mode | add preset <id> | add bridge\n',
  );
  return 1;
};

/**
 * Single verb registry (ADR-0036 / CODE-STYLE `cliCommands`).
 * Interactive menu choices and flag/non-TTY paths call the same operations.
 */
export const cliCommands: Record<string, CliCommand> = {
  setup: async () => await runSetup(),
  'global-install': (invocation) => runGlobalInstall(verbArgs(invocation)),
  // Auto-updater: always non-interactive. install.sh / re-runs use this path.
  update: (invocation) => {
    const args = verbArgs(invocation);
    const hasYes = args.includes('--yes') || args.includes('-y');
    return runGlobalInstall(hasYes ? args : [...args, '--yes']);
  },
  create: handleCreateCommand,
  new: (invocation) => runNew(verbArgs(invocation)),
  drop: (invocation) => runDrop(verbArgs(invocation)),
  doctor: handleDoctorCommand,
  init: async (invocation) => await runInit(verbArgs(invocation)),
  'local-dev': async () => await runLocalDev(),
  'sync-agent-layer': async (invocation) =>
    writeLinesResult(await runSyncAgentLayer(verbArgs(invocation))),
  'update-kit': async (invocation) => await runUpdateKitCommand(verbArgs(invocation)),
  'render-agent-layer': async (invocation) => {
    const templateArg = verbArgs(invocation)[0];
    const result = await runRenderAgentLayer(process.cwd(), templateArg);
    if (result.filesUpdated.length > 0) {
      process.stdout.write(`${result.filesUpdated.join('\n')}\n`);
    } else if (result.exitCode !== 0) {
      process.stderr.write(
        'No agent-layer files found to render. Run from a kit project or pass a template.\n',
      );
    }
    return result.exitCode;
  },
  'check-goals': async (invocation) => writeJsonResult(await runCheckGoals(verbArgs(invocation))),
  'check-agent-layer': async (invocation) =>
    writeJsonResult(await runCheckAgentLayer(verbArgs(invocation))),
  'plan-readiness': async (invocation) =>
    writeJsonResult(await runPlanReadiness(verbArgs(invocation))),
  'plan-setup': async (invocation) => {
    const result = await runPlanSetup(verbArgs(invocation));
    process.stdout.write(`${result.output}\n`);
    return result.exitCode;
  },
  'plan-data-model': async (invocation) =>
    writeJsonResult(await runPlanDataModel(verbArgs(invocation))),
  'apply-preset': async (invocation) => writeJsonResult(await runApplyPreset(verbArgs(invocation))),
  'list-presets': () => writeJsonResult(runListPresets()),
  'list-pieces': async (invocation) => writeJsonResult(await runListPieces(verbArgs(invocation))),
  'list-page-recipes': async (invocation) =>
    writeJsonResult(await runListPageRecipes(verbArgs(invocation))),
  'verify-presets': async (invocation) =>
    writeJsonResult(await runVerifyPresets(verbArgs(invocation))),
  'lint-extension-skill': async (invocation) =>
    writeJsonResult(await runLintExtensionSkill(verbArgs(invocation))),
  'doc-fallback': (invocation) => writeJsonResult(runDocFallback(verbArgs(invocation))),
  'live-work': async (invocation) => {
    if (invocation.noun === 'data') {
      return writeJsonResult(await runLiveWorkData([...invocation.rest]));
    }
    if (invocation.noun === 'host') {
      return writeJsonResult(await runLiveWorkHost([...invocation.rest]));
    }
    if (invocation.noun === 'payments') {
      return writeJsonResult(await runLiveWorkPayments([...invocation.rest]));
    }
    process.stderr.write(
      'Usage: vybekiit live-work data|host|payments [--mode=demo|dogfood|buyer] [--vendor=…] [--cwd=dir] [--no-pin] [--fresh]\n',
    );
    return 1;
  },
  dedup: async (invocation) => {
    const result = await runDedup(verbArgs(invocation));
    if (result.output !== '') {
      process.stdout.write(result.output);
    }
    return result.exitCode;
  },
  add: handleAddCommand,
  env: handleEnvCommand,
  scaffold: async (invocation) => {
    if (invocation.noun !== 'backend') {
      process.stderr.write('Unknown scaffold command. Try: vybekiit scaffold backend\n');
      return 1;
    }
    return writeMessageResult(await runScaffoldBackend([...invocation.rest], process.cwd()));
  },
  backend: handleBackendCommand,
  feedback: (invocation) => runFeedback(verbArgs(invocation)),
};

/**
 * Every dispatchable top-level verb, in registration order.
 *
 * Exported so `CLI_HELP_ALL` stays the enforced test surface for the verb registry
 * (see cliHelp.test.ts): a new handler that never reaches the help text fails the drift
 * guard instead of silently shipping undocumented.
 */
export const COMMAND_NAMES: readonly string[] = Object.keys(cliCommands);

/**
 * Run the VybeKiit CLI for a parsed argv list.
 *
 * @param argv - Process arguments after the binary name.
 * @returns Exit code for the command.
 * @example
 * const code = await runCli(['--help']);
 */
export const runCli = async (argv: readonly string[]): Promise<number> => {
  const invocation = parseInvocation(argv);

  if (invocation === null) {
    if (isInteractive()) {
      const choice = await promptMainMenu();
      if (choice === null) {
        return 1;
      }
      return await runMainMenuChoice(choice);
    }
    process.stdout.write(`${CLI_HELP}\n`);
    return 0;
  }

  if (invocation.verb === 'help' || invocation.verb === '--help' || invocation.verb === '-h') {
    process.stdout.write(`${wantsFullHelp(argv) ? CLI_HELP_ALL : CLI_HELP}\n`);
    return 0;
  }
  if (invocation.verb === '--version' || invocation.verb === '-v') {
    process.stdout.write(`${await readVersion()}\n`);
    return 0;
  }

  if (!(GATE_EXEMPT.has(invocation.verb) || ensureAccessOrExit())) {
    return 1;
  }

  const handler = cliCommands[invocation.verb];
  if (handler === undefined) {
    process.stderr.write(
      `Unknown command: ${invocation.verb}\nTry: vybekiit   or   vybekiit --help\n`,
    );
    return 1;
  }
  return await handler(invocation);
};
