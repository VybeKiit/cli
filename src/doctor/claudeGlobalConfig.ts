import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { type GlobalPaths, resolveGlobalPaths } from '../global/globalPaths';

/** Snapshot of what the global VybeKiit install has landed on this machine. */
export type GlobalStatus = {
  /** `/vybekiit` slash command present. */
  readonly hasCommand: boolean;
  /** VybeKiit block present in the global CLAUDE.md. */
  readonly hasMemory: boolean;
  /** Count of VybeKiit-managed skills in ~/.claude/skills. */
  readonly skillCount: number;
};

/**
 * Whether a path exists.
 *
 * @param path - Path to probe.
 * @returns True when it exists.
 */
const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Count VybeKiit-managed skills (dirs carrying our `.vybekiit-managed` marker).
 *
 * @param skillsDir - The global skills dir.
 * @returns Managed skill count.
 */
const countManagedSkills = async (skillsDir: string): Promise<number> => {
  let count = 0;
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && (await exists(join(skillsDir, entry.name, '.vybekiit-managed')))) {
        count += 1;
      }
    }
  } catch {
    return 0;
  }
  return count;
};

/**
 * Read the current global-install status.
 *
 * @param paths - Resolved global paths (defaults to the real ones).
 * @returns The {@link GlobalStatus}.
 * @example
 * const status = await readGlobalStatus();
 */
export const readGlobalStatus = async (
  paths: GlobalPaths = resolveGlobalPaths(),
): Promise<GlobalStatus> => {
  let hasMemory = false;
  try {
    hasMemory = (await readFile(paths.memoryFile, 'utf8')).includes('BEGIN VYBEKIIT');
  } catch {
    hasMemory = false;
  }
  return {
    hasCommand: await exists(join(paths.commandsDir, 'vybekiit.md')),
    hasMemory,
    skillCount: await countManagedSkills(paths.skillsDir),
  };
};

/**
 * Whether the global install is fully in place.
 *
 * @param status - A status snapshot.
 * @returns True when command, memory, and at least one skill are present.
 * @example
 * isGloballyInstalled(await readGlobalStatus());
 */
export const isGloballyInstalled = (status: GlobalStatus): boolean =>
  status.hasCommand && status.hasMemory && status.skillCount > 0;

/**
 * Format the doctor status line for the global install.
 *
 * @param status - A status snapshot.
 * @returns One line for the doctor report.
 * @example
 * formatGlobalStatus(await readGlobalStatus());
 */
export const formatGlobalStatus = (status: GlobalStatus): string => {
  if (isGloballyInstalled(status)) {
    return `✓ VybeKiit global - active in every project (${status.skillCount} skills, /vybekiit command, Claude is aware).`;
  }
  return '→ VybeKiit global - not set up yet. Run `vybekiit setup` (or `vybekiit global-install`) to add it to every project.';
};
