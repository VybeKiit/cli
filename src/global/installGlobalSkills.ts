import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { GlobalPaths } from './globalPaths';
import { MANAGED_SKILL_MARKER } from './managedSkills';

/** Outcome of a global skills install. */
export type SkillsInstallResult = {
  /** Skills copied or refreshed this run. */
  readonly installed: readonly string[];
  /** Same-named skills the user owns — skipped to avoid clobbering them. */
  readonly skipped: readonly string[];
  /** Absolute skills dir written to. */
  readonly path: string;
};

/**
 * Whether a filesystem path exists.
 *
 * @param path - Path to probe.
 * @returns True when it exists.
 */
const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Resolve which skills the bundled payload ships — from its manifest, falling back to a
 * directory listing.
 *
 * @param sourceDir - Bundled skills dir (dist/global-skills).
 * @returns Sorted skill names.
 */
const listBundledSkills = async (sourceDir: string): Promise<string[]> => {
  try {
    const manifest = JSON.parse(await readFile(join(sourceDir, 'manifest.json'), 'utf8')) as {
      readonly skills?: readonly string[];
    };
    if (Array.isArray(manifest.skills)) {
      return [...manifest.skills];
    }
  } catch {
    // No manifest — fall back to listing directories.
  }
  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
};

/**
 * Copy the bundled skills into ~/.claude/skills. Idempotent: refreshes VybeKiit-managed
 * skills and skips any same-named skill the user authored.
 *
 * @param paths - Resolved global paths.
 * @param sourceDir - Override for the bundled payload (defaults to the shipped one).
 * @returns Which skills were installed vs. skipped.
 * @example
 * const result = await installGlobalSkills(resolveGlobalPaths());
 */
export const installGlobalSkills = async (
  paths: GlobalPaths,
  sourceDir: string = paths.bundledSkillsDir,
): Promise<SkillsInstallResult> => {
  const names = await listBundledSkills(sourceDir);
  await mkdir(paths.skillsDir, { recursive: true });

  const installed: string[] = [];
  const skipped: string[] = [];

  for (const name of names) {
    const dest = join(paths.skillsDir, name);
    if (await pathExists(dest)) {
      if (!(await pathExists(join(dest, MANAGED_SKILL_MARKER)))) {
        skipped.push(name);
        continue;
      }
      await rm(dest, { recursive: true, force: true });
    }
    await cp(join(sourceDir, name), dest, { recursive: true });
    await writeFile(join(dest, MANAGED_SKILL_MARKER), '', 'utf8');
    installed.push(name);
  }

  return { installed, skipped, path: paths.skillsDir };
};
