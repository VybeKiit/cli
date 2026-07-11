import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { resolveKitSource } from '../lib/resolveKitSource';
import { ScaffoldError } from '../lib/scaffold';
import { scaffoldKitWorkspace } from '../lib/scaffoldKitWorkspace';
import { isInteractive } from '../prompts/tty';
import {
  type CreateSurface,
  formatCreateError,
  formatCreateSuccess,
  formatCreateUsage,
  isCreateSurface,
  surfaceToTemplate,
} from './scaffoldOutput';

/**
 * Whether the destination is missing or empty so a failed scaffold may delete it.
 *
 * @param dest - Absolute destination path.
 * @returns True when cleanup will not destroy pre-existing buyer files.
 */
const destIsMissingOrEmpty = async (dest: string): Promise<boolean> => {
  try {
    const entries = await readdir(dest);
    return entries.length === 0;
  } catch {
    return true;
  }
};

/** Parsed `create app` inputs after flags and optional directory. */
export type CreateAppInputs = {
  readonly surface: CreateSurface;
  readonly destPath: string;
};

/**
 * Parse `create app` arguments into a single surface and destination path.
 *
 * @param args - Arguments after `create app`.
 * @returns Parsed inputs, or an error message when invalid.
 * @example
 * const parsed = parseCreateAppArgs(['--web', 'my-app']);
 */
export const parseCreateAppArgs = (
  args: readonly string[],
):
  | { readonly ok: true; readonly inputs: CreateAppInputs }
  | { readonly ok: false; readonly error: string } => {
  const surfaces: CreateSurface[] = [];
  const positionals: string[] = [];

  for (const arg of args) {
    if (arg === '--web' || arg === '--mobile' || arg === '--extension') {
      surfaces.push(arg.slice(2) as CreateSurface);
      continue;
    }
    if (arg.startsWith('--')) {
      return {
        ok: false,
        error: `Unknown flag: ${arg}. Use --web, --mobile, or --extension.`,
      };
    }
    positionals.push(arg);
  }

  if (surfaces.length === 0) {
    return { ok: false, error: 'missing-surface' };
  }
  if (surfaces.length > 1) {
    return { ok: false, error: 'Pick one surface for now (--web, --mobile, or --extension).' };
  }

  const surface = surfaces[0];
  if (surface === undefined || !isCreateSurface(surface)) {
    return { ok: false, error: 'missing-surface' };
  }

  const destPath =
    positionals[0] !== undefined && positionals[0] !== '' ? positionals[0] : `./${surface}`;

  return { ok: true, inputs: { surface, destPath } };
};

/**
 * Prompt for a create-app surface when none was passed on the CLI.
 *
 * @returns Selected surface, or null when cancelled.
 * @example
 * const surface = await promptCreateSurface();
 */
export const promptCreateSurface = async (): Promise<CreateSurface | null> => {
  const { cancel, intro, isCancel, outro, select } = await import('@clack/prompts');
  intro('VybeKiit — create an app');
  const picked = await select({
    message: 'What are you building?',
    options: [
      { value: 'web', label: 'Web app', hint: 'Next.js + dashboard + marketing' },
      { value: 'mobile', label: 'Mobile app', hint: 'Expo' },
      { value: 'extension', label: 'Browser extension', hint: 'WXT' },
    ],
  });
  if (isCancel(picked) || typeof picked !== 'string' || !isCreateSurface(picked)) {
    cancel('Cancelled.');
    return null;
  }
  outro(`Great — creating ${picked} next.`);
  return picked;
};

/**
 * Write lines to stdout.
 *
 * @param lines - Lines to print.
 * @returns Void after all lines are written.
 */
const writeStdout = (lines: readonly string[]): void => {
  for (const line of lines) {
    process.stdout.write(`${line}\n`);
  }
};

/**
 * Write lines to stderr.
 *
 * @param lines - Lines to print.
 * @returns Void after all lines are written.
 */
const writeStderr = (lines: readonly string[]): void => {
  for (const line of lines) {
    process.stderr.write(`${line}\n`);
  }
};

/**
 * Create a kit workspace + app surface (`vybekiit create app --web|…`).
 *
 * @param args - Arguments after `create app`.
 * @returns Process exit code.
 * @example
 * const code = await runCreateApp(['--web', 'my-app']);
 */
export const runCreateApp = async (args: readonly string[]): Promise<number> => {
  let parsed = parseCreateAppArgs(args);

  if (!parsed.ok && parsed.error === 'missing-surface') {
    if (!isInteractive()) {
      writeStderr(formatCreateUsage());
      return 1;
    }
    const surface = await promptCreateSurface();
    if (surface === null) {
      return 1;
    }
    parsed = parseCreateAppArgs([`--${surface}`, ...args.filter((arg) => !arg.startsWith('--'))]);
  }

  if (!parsed.ok) {
    if (parsed.error === 'missing-surface') {
      writeStderr(formatCreateUsage());
    } else {
      writeStderr(formatCreateError(parsed.error));
      writeStderr(formatCreateUsage());
    }
    return 1;
  }

  const { destPath, surface } = parsed.inputs;
  const template = surfaceToTemplate(surface);
  const dest = resolve(process.cwd(), destPath);
  let cleanup: (() => Promise<void>) | undefined;
  /** Only wipe dest on failure when it was empty/missing before we wrote. */
  const mayCleanupPartial = await destIsMissingOrEmpty(dest);

  try {
    // ADR-0038 Track 2: kit workspace (packages + surface), never an orphan template folder.
    const { cleanup: resolvedCleanup, kitRoot } = await resolveKitSource();
    cleanup = resolvedCleanup;
    await scaffoldKitWorkspace({ template, kitRoot, dest });
  } catch (error) {
    if (mayCleanupPartial) {
      // Partial create left incomplete packages/templates (dogfood: mobile ENOENT mid-copy).
      await rm(dest, { recursive: true, force: true }).catch(() => undefined);
    }
    if (error instanceof ScaffoldError) {
      writeStderr(formatCreateError(error.message));
      return 1;
    }
    const message = error instanceof Error ? error.message : 'Could not create the app.';
    writeStderr(formatCreateError(message));
    return 1;
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }

  writeStdout(formatCreateSuccess(surface, destPath));
  return 0;
};
