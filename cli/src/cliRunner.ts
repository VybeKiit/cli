import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CLI_HELP } from './cliHelp';
import { runAddBridge } from './commands/addBridge';
import {
  runBackendAddCrud,
  runBackendAddRoute,
  runBackendAddUpload,
  runScaffoldBackend,
} from './commands/backendCli';
import { runCheckAgentLayer } from './commands/checkAgentLayer';
import { runCheckGoals } from './commands/checkGoals';
import { runDedup } from './commands/dedup';
import { runDocFallback } from './commands/docFallback';
import { runDrop } from './commands/drop';
import { runInit } from './commands/init';
import { runLintExtensionSkill } from './commands/lintExtensionSkill';
import { runLocalDev } from './commands/localDev';
import { runNew } from './commands/new';
import { runPlanDataModel } from './commands/planDataModelCmd';
import { runPlanReadiness } from './commands/planReadiness';
import { runPlanSetup } from './commands/planSetupCmd';
import { runApplyPreset, runListPresets, runVerifyPresets } from './commands/presetsCmd';
import { runRenderAgentLayer } from './commands/renderAgentLayer';
import { runSetup } from './commands/setup';
import { runSyncAgentLayer } from './commands/syncAgentLayer';
import { ensureTool, formatEnsureResult } from './doctor/ensureTool';
import { ensureAccessOrExit } from './doctor/gate';
import { runDoctor } from './doctor/run';
import { runEnvWizard } from './prompts/envWizard';
import { isInteractive } from './prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

type CliCommandContext = {
  readonly command: string;
  readonly subcommand: string | undefined;
  readonly rest: readonly string[];
};

type CliCommandHandler = (context: CliCommandContext) => Promise<number> | number;

/**
 * Read the CLI's own version from its package.json.
 *
 * @returns Package version string.
 * @example
 * const version = await readVersion();
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
 * Parse raw argv into command, subcommand, and remaining arguments.
 *
 * @param argv - Process arguments after the binary name.
 * @returns Parsed command context, or null when no command was provided.
 * @example
 * const context = parseCommand(['doctor', '--ensure', 'wrangler']);
 */
const parseCommand = (argv: readonly string[]): CliCommandContext | null => {
  const [command, subcommand, ...rest] = argv;
  if (command === undefined || command === '') {
    return null;
  }
  return { command, subcommand, rest };
};

/**
 * Build an argument list that includes a present subcommand.
 *
 * @param context - Parsed CLI command context.
 * @returns Arguments with subcommand restored when present.
 * @example
 * const args = commandArgs(context);
 */
const commandArgs = (context: CliCommandContext): string[] => {
  if (context.subcommand !== undefined) {
    return [context.subcommand, ...context.rest];
  }
  return [...context.rest];
};

/**
 * Print each output line from a command result.
 *
 * @param lines - Lines to print in order.
 * @returns Void after all lines are printed.
 * @example
 * writeLines(['Done.']);
 */
const writeLines = (lines: readonly string[]): void => {
  for (const line of lines) {
    process.stdout.write(`${line}\n`);
  }
};

/**
 * Resolve the `doctor --ensure` tool name from inline or following argument syntax.
 *
 * @param args - Doctor command arguments.
 * @param ensureArg - Matched ensure argument.
 * @returns Tool name, or undefined when the command is incomplete.
 * @example
 * const tool = resolveEnsureToolName(['--ensure', 'wrangler'], '--ensure');
 */
const resolveEnsureToolName = (args: readonly string[], ensureArg: string): string | undefined => {
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
 * @example
 * const code = runDoctorEnsure('wrangler', true);
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

  const result = ensureTool(toolName);
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: result.installed, ...result })}\n`);
  } else {
    process.stdout.write(`${formatEnsureResult(result)}\n`);
  }
  return result.installed ? 0 : 1;
};

/**
 * Run doctor command variants.
 *
 * @param context - Parsed CLI command context.
 * @returns Exit code for doctor.
 * @example
 * const code = await handleDoctorCommand(context);
 */
const handleDoctorCommand = async (context: CliCommandContext): Promise<number> => {
  const args = commandArgs(context);
  const ensureArg = args.find((arg) => arg === '--ensure' || arg.startsWith('--ensure='));
  if (ensureArg === undefined) {
    return await runDoctor();
  }

  return runDoctorEnsure(resolveEnsureToolName(args, ensureArg), args.includes('--json'));
};

/**
 * Run backend command variants.
 *
 * @param context - Parsed CLI command context.
 * @returns Exit code for backend commands.
 * @example
 * const code = await handleBackendCommand(context);
 */
const handleBackendCommand = async (context: CliCommandContext): Promise<number> => {
  if (context.subcommand === 'add-route') {
    const result = await runBackendAddRoute([...context.rest]);
    process.stdout.write(`${result.message}\n`);
    return result.exitCode;
  }
  if (context.subcommand === 'add-crud') {
    const result = await runBackendAddCrud([...context.rest]);
    process.stdout.write(`${result.message}\n`);
    return result.exitCode;
  }
  if (context.subcommand === 'add-upload') {
    const result = await runBackendAddUpload();
    process.stdout.write(`${result.message}\n`);
    return result.exitCode;
  }
  return 1;
};

/**
 * Run env command variants.
 *
 * @param context - Parsed CLI command context.
 * @returns Exit code for env commands.
 * @example
 * const code = await handleEnvCommand(context);
 */
const handleEnvCommand = async (context: CliCommandContext): Promise<number> => {
  if (context.subcommand !== 'wizard') {
    return 1;
  }
  if (!isInteractive()) {
    process.stderr.write('env wizard requires an interactive terminal.\n');
    return 1;
  }
  return await runEnvWizard();
};

const COMMAND_HANDLERS: Record<string, CliCommandHandler> = {
  setup: async () => await runSetup(),
  new: (context) => runNew([...context.rest]),
  drop: (context) => runDrop(commandArgs(context)),
  doctor: handleDoctorCommand,
  init: async (context) => await runInit([...context.rest]),
  'local-dev': async () => await runLocalDev(),
  'sync-agent-layer': async (context) => {
    const result = await runSyncAgentLayer([...context.rest]);
    writeLines(result.lines);
    return result.exitCode;
  },
  'render-agent-layer': async () => (await runRenderAgentLayer()).exitCode,
  'check-goals': async (context) => {
    const result = await runCheckGoals([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'check-agent-layer': async (context) => {
    const result = await runCheckAgentLayer([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'plan-readiness': async (context) => {
    const result = await runPlanReadiness([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'plan-setup': async (context) => {
    const result = await runPlanSetup([...context.rest]);
    process.stdout.write(`${result.output}\n`);
    return result.exitCode;
  },
  'plan-data-model': async (context) => {
    const result = await runPlanDataModel([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'apply-preset': async (context) => {
    const result = await runApplyPreset([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'list-presets': () => {
    const result = runListPresets();
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'verify-presets': async (context) => {
    const result = await runVerifyPresets([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'lint-extension-skill': async (context) => {
    const result = await runLintExtensionSkill([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  'doc-fallback': (context) => {
    const result = runDocFallback([...context.rest]);
    process.stdout.write(`${result.json}\n`);
    return result.exitCode;
  },
  dedup: async (context) => {
    const result = await runDedup(commandArgs(context));
    if (result.output !== '') {
      process.stdout.write(result.output);
    }
    return result.exitCode;
  },
  add: async (context) => {
    if (context.subcommand !== 'bridge') {
      return 1;
    }
    return await runAddBridge([...context.rest]);
  },
  env: handleEnvCommand,
  scaffold: async (context) => {
    if (context.subcommand !== 'backend') {
      return 1;
    }
    const result = await runScaffoldBackend([...context.rest], process.cwd());
    process.stdout.write(`${result.message}\n`);
    return result.exitCode;
  },
  backend: handleBackendCommand,
};

/**
 * Run the VybeKiit CLI for a parsed argv list.
 *
 * @param argv - Process arguments after the binary name.
 * @returns Exit code for the command.
 * @example
 * const code = await runCli(['--help']);
 */
export const runCli = async (argv: readonly string[]): Promise<number> => {
  const context = parseCommand(argv);
  if (
    context === null ||
    context.command === 'help' ||
    context.command === '--help' ||
    context.command === '-h'
  ) {
    process.stdout.write(`${CLI_HELP}\n`);
    return 0;
  }
  if (context.command === '--version' || context.command === '-v') {
    process.stdout.write(`${await readVersion()}\n`);
    return 0;
  }

  if (context.command !== 'doctor' && !ensureAccessOrExit()) {
    return 1;
  }

  const handler = COMMAND_HANDLERS[context.command];
  if (handler === undefined) {
    return 1;
  }
  return await handler(context);
};
