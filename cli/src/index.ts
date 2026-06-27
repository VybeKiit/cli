import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScaffoldError, TEMPLATES, isTemplateName, scaffold } from './scaffold';

const HERE = dirname(fileURLToPath(import.meta.url));

const HELP = `vybekiit — scaffold a VybeKiit template into your own repo

Usage:
  vybekiit new <template> [directory]

Templates:
  web         Next.js + shadcn (RTL-ready) + the agent layer   [available]
  mobile      Expo                                             [ships in v2]
  extension   WXT                                              [ships in v3]

Examples:
  vybekiit new web my-app
  vybekiit new web .

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

/**
 * Locate the template sources. In the monorepo they're at `../templates`; a real
 * published install resolves them from the private repo, overridable via env so
 * CI and the scaffolder share one seam.
 */
function resolveTemplatesDir(): string {
  return process.env.VYBEKIIT_TEMPLATES_DIR ?? resolve(HERE, '..', '..', 'templates');
}

async function runNew(args: string[]): Promise<number> {
  const [template, dir] = args;
  if (!template || !isTemplateName(template)) {
    console.error(`Pick a template: ${TEMPLATES.join(', ')}.\n\n${HELP}`);
    return 1;
  }

  const dest = resolve(process.cwd(), dir ?? template);
  try {
    await scaffold({
      template,
      source: resolveTemplatesDir(),
      dest,
      packagesVersion: await readVersion(),
    });
  } catch (error) {
    if (error instanceof ScaffoldError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }

  console.log(`\n✓ Created your ${template} project in ${dest}\n`);
  console.log(
    'Next: open it with Claude or Codex and say "set up my app" — the agent takes it from here.\n',
  );
  return 0;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
    return 0;
  }
  if (command === '--version' || command === '-v') {
    console.log(await readVersion());
    return 0;
  }
  if (command === 'new') {
    return runNew(rest);
  }

  console.error(`Unknown command "${command}".\n\n${HELP}`);
  return 1;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
