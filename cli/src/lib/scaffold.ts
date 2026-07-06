import { access, cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Templates the CLI can scaffold. Mobile/extension ship in v2/v3. Backend is API-only for mobile/ext clients. */
export const TEMPLATES = ['web', 'spa', 'mobile', 'extension', 'backend'] as const;
export type TemplateName = (typeof TEMPLATES)[number];

/** Thrown for expected, user-facing failures so the entrypoint can print one clean line. */
export class ScaffoldError extends Error {}

/**
 * Directories never copied into a buyer's repo (build artifacts / installed deps).
 * `.git` is here because a published install scaffolds from a *cloned* mirror — the
 * buyer must start a clean project, not inherit the mirror's shallow history + remote
 * (ADR-0005). `dev` skips maintainer-only `scripts/dev/` scratch (ADR-0027).
 */
const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'dist', '.turbo', '.git', 'dev']);

/** @returns whether a source path should be copied during scaffold */
export function shouldCopyScaffoldPath(src: string): boolean {
  const parts = src.split(/[/\\]/);
  if (parts.some((part) => SKIP_DIR_NAMES.has(part))) {
    return false;
  }
  return !/(?:^|[/\\])scripts[/\\]dev(?:[/\\]|$)/.test(src);
}

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
}

/**
 * Copy a template into a fresh destination, preserving its `workspace:*` deps.
 *
 * Since ADR-0033 (CLI is the only published artifact) buyers work inside the gated
 * monorepo clone, where `@vybekiit/*` resolve locally via the workspace — so the
 * copied `package.json` keeps `workspace:*` untouched (no npm rewrite). Refuses to
 * write into a non-empty directory (never clobber a buyer's work) and skips build
 * artifacts. Throws {@link ScaffoldError} for expected problems so the entrypoint
 * translates them into a single plain-language line.
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
    filter: (src) => shouldCopyScaffoldPath(src),
  });

  return { dest: options.dest };
}
