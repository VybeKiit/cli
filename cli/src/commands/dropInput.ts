import { resolve } from 'node:path';
import { isTemplateName, TEMPLATES } from '../lib/scaffold';
import { isInteractive } from '../prompts/tty';
import {
  DROP_TEMPLATE_OPTIONS,
  type DropFlags,
  dropMode,
  type ParsedDropArgs,
  type ResolvedDropInputs,
} from './dropTypes';

/**
 * Parse raw CLI arguments into flags and positional drop inputs.
 *
 * @param args - CLI arguments after the `drop` command name.
 * @returns Parsed flags plus any template/path positional values.
 * @example
 * const parsed = parseDropArgs(['web', './app', '--merge']);
 */
export const parseDropArgs = (args: readonly string[]): ParsedDropArgs => {
  const flags: DropFlags = {
    force: args.includes('--force'),
    merge: args.includes('--merge'),
    dryRun: args.includes('--dry-run'),
    json: args.includes('--json'),
  };
  const [first, second] = args.filter((arg) => !arg.startsWith('--'));

  if (first !== undefined && isTemplateName(first)) {
    if (second !== undefined) {
      return { flags, template: first, destPath: second };
    }
    return { flags, template: first };
  }

  if (first !== undefined && second !== undefined && isTemplateName(second)) {
    return { flags, template: second, destPath: first };
  }

  if (first !== undefined) {
    return { flags, destPath: first };
  }

  return { flags };
};

/**
 * Print the non-interactive "template required" response.
 *
 * @param flags - Parsed `drop` flags controlling output format.
 * @returns Exit code for the failed command.
 * @example
 * const code = writeTemplateRequired({ force: false, merge: false, dryRun: false, json: true });
 */
const writeTemplateRequired = (flags: DropFlags): number => {
  const output = {
    error: true,
    message: `Template required. Available: ${TEMPLATES.join(', ')}`,
    usage: 'vybekiit drop <template> [path] [--force|--merge|--dry-run]',
    templates: TEMPLATES,
  };

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return 1;
  }

  process.stderr.write('❌ Template required.\n\n');
  process.stderr.write('Available templates:\n');
  for (const template of TEMPLATES) {
    process.stderr.write(`  • ${template}\n`);
  }
  process.stderr.write('\nUsage: vybekiit drop <template> [path] [--force|--merge]\n');
  process.stderr.write('\nExamples:\n');
  process.stderr.write('  vybekiit drop mobile ~/Projects/my-app\n');
  process.stderr.write('  vybekiit drop web .\n');
  process.stderr.write('  vybekiit drop backend ./api --force\n');
  return 1;
};

/**
 * Ask for missing drop inputs in an interactive terminal.
 *
 * @param parsed - Parsed CLI arguments.
 * @returns Complete drop inputs, or null when the prompt is cancelled.
 * @example
 * const inputs = await promptForDropInputs(parseDropArgs([]));
 */
const promptForDropInputs = async (parsed: ParsedDropArgs): Promise<ResolvedDropInputs | null> => {
  const { confirm, intro, isCancel, select, text, cancel } = await import('@clack/prompts');

  intro('VybeKiit: drop a template');
  const picked = await select({
    message: 'Which template?',
    options: DROP_TEMPLATE_OPTIONS,
  });

  if (isCancel(picked) || typeof picked !== 'string' || !isTemplateName(picked)) {
    cancel('Cancelled.');
    return null;
  }

  const { destPath: parsedDestPath } = parsed;
  let destPath = parsedDestPath;
  if (destPath === undefined || destPath === '') {
    const dest = await text({
      message: 'Where to drop it?',
      placeholder: `./${picked}`,
      defaultValue: `./${picked}`,
      validate: (value) =>
        typeof value === 'string' && value.trim() !== '' ? undefined : 'Path is required',
    });
    if (isCancel(dest) || typeof dest !== 'string') {
      cancel('Cancelled.');
      return null;
    }
    destPath = dest;
  }

  const mode = dropMode(parsed.flags);
  const confirmed = await confirm({
    message: `Drop "${picked}" -> ${resolve(destPath)}${mode === 'new' ? '' : ` (${mode})`}?`,
  });
  if (isCancel(confirmed) || !confirmed) {
    cancel('Cancelled.');
    return null;
  }

  return { flags: parsed.flags, template: picked, destPath };
};

/**
 * Resolve complete drop inputs from CLI args and, when possible, prompts.
 *
 * @param parsed - Parsed CLI arguments.
 * @returns Complete inputs, or null when the command should stop.
 * @example
 * const inputs = await resolveDropInputs(parseDropArgs(['web']));
 */
export const resolveDropInputs = async (
  parsed: ParsedDropArgs,
): Promise<ResolvedDropInputs | null> => {
  if (parsed.template !== undefined) {
    const destPath =
      parsed.destPath !== undefined && parsed.destPath !== ''
        ? parsed.destPath
        : `./${parsed.template}`;
    return { flags: parsed.flags, template: parsed.template, destPath };
  }

  if (!isInteractive()) {
    writeTemplateRequired(parsed.flags);
    return null;
  }

  return await promptForDropInputs(parsed);
};
