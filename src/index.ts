import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runDoctor } from './doctor/run';
import { resolveTemplatesSource } from './resolve-templates';
import { isTemplateName, ScaffoldError, scaffold } from './scaffold';
import { runSyncAgentLayer } from './sync-agent-layer';

const HERE = dirname(fileURLToPath(import.meta.url));

const _HELP = `vybekiit — scaffold a VybeKiit template into your own repo

Usage:
  vybekiit new <template> [directory]
  vybekiit doctor
  vybekiit sync-agent-layer [template]

Templates:
  web         Next.js + shadcn (RTL-ready) + the agent layer   [available]
  mobile      Expo                                             [available]
  extension   WXT                                              [ships in v3]

Commands:
  new                 Scaffold a template into your own repo
  doctor              Set up + check the tools your app needs (installs them, checks sign-in)
  sync-agent-layer    Refresh agent instructions from the latest template mirror

Examples:
  vybekiit new web my-app
  vybekiit new web .
  vybekiit doctor

Options:
  -h, --help       Show this help
  -v, --version    Show the CLI version
`;

/** Read the CLI's own version from its package.json (also used to pin scaffolded deps). */
async function readVersion(): Promise<string> {
  try {
    const raw = await readFile(join(HERE, '..', 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export {
  cloneMirror,
  type ResolveDeps,
  type ResolvedSource,
  resolveTemplatesSource,
} from './resolve-templates';

async function runNew(args: string[]): Promise<number> {
  const [template, dir] = args;
  if (!(template && isTemplateName(template))) {
    return 1;
  }

  const dest = resolve(process.cwd(), dir ?? template);
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveTemplatesSource(template);
    cleanup = resolved.cleanup;
    await scaffold({
      template,
      source: resolved.source,
      dest,
      packagesVersion: await readVersion(),
    });
  } catch (error) {
    if (error instanceof ScaffoldError) {
      return 1;
    }
    throw error;
  } finally {
    await cleanup?.();
  }
  return 0;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return 0;
  }
  if (command === '--version' || command === '-v') {
    return 0;
  }
  if (command === 'new') {
    return runNew(rest);
  }
  if (command === 'doctor') {
    return await runDoctor();
  }
  if (command === 'sync-agent-layer') {
    const result = await runSyncAgentLayer(rest);
    for (const _line of result.lines) {
    }
    return result.exitCode;
  }
  return 1;
}

/**
 * Run as the bin only when this module is the process entrypoint — not when a test (or
 * any other module) imports its exported helpers. Guards against `main()` calling
 * `process.exit` during unit tests of {@link resolveTemplatesSource} / {@link cloneMirror}.
 */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((_error) => {
      process.exit(1);
    });
}
