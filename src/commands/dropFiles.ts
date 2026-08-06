import { access, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldCopyDropPath } from '../lib/deliveryCopyPolicy';
import type { TemplateName } from '../lib/scaffold';
import { locateTemplateSource } from '../lib/templateSource';
import type { DropContext, DropDestinationState, DropFlags, DropTemplateSource } from './dropTypes';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Locate template files from the monorepo checkout or the configured mirror source.
 *
 * @param template - Template to copy.
 * @returns Template source root and optional cleanup callback.
 * @example
 * const source = await locateDropTemplateSource('web');
 */
export const locateDropTemplateSource = async (
  template: TemplateName,
): Promise<DropTemplateSource> => {
  const monorepoTemplates = join(HERE, '..', '..', '..', 'templates');
  try {
    await access(join(monorepoTemplates, template));
    return { source: monorepoTemplates };
  } catch {
    const { cleanup, source } = await locateTemplateSource(template);
    if (cleanup === undefined) {
      return { source };
    }
    return { cleanup, source };
  }
};

/**
 * Read whether the destination exists and already contains files.
 *
 * @param dest - Absolute destination path.
 * @returns Destination existence and file-presence state.
 * @example
 * const state = await readDropDestinationState('/tmp/my-app');
 */
export const readDropDestinationState = async (dest: string): Promise<DropDestinationState> => {
  try {
    await access(dest);
    const contents = await readdir(dest);
    return { exists: true, hasFiles: contents.length > 0 };
  } catch {
    return { exists: false, hasFiles: false };
  }
};

/**
 * Check if copying should be blocked because the destination is not empty.
 *
 * @param flags - Parsed `drop` flags.
 * @param state - Destination existence state.
 * @returns True when the command needs `--force` or `--merge`.
 * @example
 * const blocked = shouldBlockDestination(flags, { exists: true, hasFiles: true });
 */
export const shouldBlockDestination = (flags: DropFlags, state: DropDestinationState): boolean =>
  state.hasFiles && !flags.force && !flags.merge;

/**
 * List template files that would be copied by the drop command.
 *
 * @param dir - Current template directory to scan.
 * @param prefix - Relative path prefix for recursive calls.
 * @returns Relative file paths eligible for copying.
 * @example
 * const files = await listTemplateFiles('/repo/templates/web');
 */
export const listTemplateFiles = async (dir: string, prefix = ''): Promise<string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const nestedFiles = await Promise.all(
      entries.map(async (entry) => {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (!shouldCopyDropPath(rel)) {
          return [];
        }
        if (entry.isDirectory()) {
          return await listTemplateFiles(join(dir, entry.name), rel);
        }
        return [rel];
      }),
    );
    return nestedFiles.flat();
  } catch {
    return [];
  }
};

/**
 * Copy the template into the destination according to the selected mode.
 *
 * @param context - Resolved drop context.
 * @returns Promise that resolves after the template files are copied.
 */
export const copyDropTemplate = async (context: DropContext): Promise<void> => {
  const { dest, flags, templateDir } = context;
  await mkdir(dest, { recursive: true });
  await cp(templateDir, dest, {
    recursive: true,
    force: !flags.merge,
    filter: (src) => {
      if (!shouldCopyDropPath(src)) {
        return false;
      }
      return true;
    },
  });
};

type MutablePackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly [key: string]: unknown;
};

/**
 * Pin workspace dependencies to a publishable npm version in the dropped package.
 *
 * @param dest - Destination directory that may contain `package.json`.
 * @returns Promise that resolves after dependency versions are updated.
 */
export const pinDeps = async (dest: string): Promise<void> => {
  const pkgPath = join(dest, 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as MutablePackageJson;
    for (const field of ['dependencies', 'devDependencies'] as const) {
      const deps = pkg[field];
      if (deps !== undefined) {
        for (const [key, value] of Object.entries(deps)) {
          if (value === 'workspace:*' || value.startsWith('workspace:')) {
            deps[key] = '*';
          }
        }
      }
    }
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  } catch {
    // Missing or unreadable package files are fine for non-Node templates.
  }
};

/**
 * Run a cleanup callback when the template source created temporary files.
 *
 * @param cleanup - Optional cleanup callback from template resolution.
 * @returns Promise that resolves after cleanup, when present.
 */
export const cleanupDropSource = async (
  cleanup: (() => Promise<void>) | undefined,
): Promise<void> => {
  if (cleanup !== undefined) {
    await cleanup();
  }
};
