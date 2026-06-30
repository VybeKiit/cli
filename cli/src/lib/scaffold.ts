import { access, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { type DependencyMap, rewriteWorkspaceDeps } from './rewrite-deps';

/** Templates the CLI can scaffold. Mobile/extension ship in v2/v3. Backend is API-only for mobile/ext clients. */
export const TEMPLATES = ['web', 'spa', 'mobile', 'extension', 'backend'] as const;
export type TemplateName = (typeof TEMPLATES)[number];

/** Thrown for expected, user-facing failures so the entrypoint can print one clean line. */
export class ScaffoldError extends Error {}

/**
 * Directories never copied into a buyer's repo (build artifacts / installed deps).
 * `.git` is here because a published install scaffolds from a *cloned* mirror — the
 * buyer must start a clean project, not inherit the mirror's shallow history + remote
 * (ADR-0005).
 */
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo', '.git']);

export function isTemplateName(value: string): value is TemplateName {
  return (TEMPLATES as readonly string[]).includes(value);
}

/** Inputs for {@link scaffold}. */
export interface ScaffoldOptions {
  readonly template: TemplateName;
  /** Directory holding the template sources (the monorepo's `templates/`). */
  readonly source: string;
  /** Destination directory to create the new project in. */
  readonly dest: string;
  /** npm version to pin `@vybekiit/*` dependencies to in the scaffolded project. */
  readonly packagesVersion: string;
}

/** Rewrite a copied `package.json` so it consumes `@vybekiit/*` from npm, not the workspace. */
async function pinScaffoldedDeps(dest: string, packagesVersion: string): Promise<void> {
  const pkgPath = join(dest, 'package.json');
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch {
    return; // template has no package.json — nothing to pin
  }

  const pkg: Record<string, unknown> = JSON.parse(raw);
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const deps = pkg[field];
    if (deps && typeof deps === 'object') {
      pkg[field] = rewriteWorkspaceDeps(deps as DependencyMap, packagesVersion);
    }
  }
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * Copy a template into a fresh destination and pin its `@vybekiit/*` deps to npm.
 *
 * Refuses to write into a non-empty directory (never clobber a buyer's work) and
 * skips build artifacts. Throws {@link ScaffoldError} for expected problems so the
 * entrypoint translates them into a single plain-language line.
 */
export async function scaffold(options: ScaffoldOptions): Promise<{ dest: string }> {
  const sourceDir = join(options.source, options.template);
  try {
    await access(sourceDir);
  } catch {
    throw new ScaffoldError(`Template "${options.template}" was not found at ${sourceDir}.`);
  }

  try {
    const existing = await readdir(options.dest);
    if (existing.length > 0) {
      throw new ScaffoldError(`Destination ${options.dest} already exists and is not empty.`);
    }
  } catch (error) {
    if (error instanceof ScaffoldError) {
      throw error;
    }
    // ENOENT — destination doesn't exist yet, which is what we want.
  }

  await cp(sourceDir, options.dest, {
    recursive: true,
    filter: (src) => !SKIP_DIRS.has(basename(src)),
  });
  await pinScaffoldedDeps(options.dest, options.packagesVersion);

  return { dest: options.dest };
}
