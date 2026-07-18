import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { GlobalPaths } from './globalPaths';
import { listManagedSkillNames, sampleManagedSkillNames } from './managedSkills';

/** Snapshot of what the global VybeKiit install has landed on this machine. */
export type GlobalStatus = {
  /** `/vybekiit` slash command present. */
  readonly hasCommand: boolean;
  /** VybeKiit block present in the global CLAUDE.md. */
  readonly hasMemory: boolean;
  /** Count of VybeKiit-managed skills in ~/.claude/skills. */
  readonly skillCount: number;
  /** Sorted sample of managed skill folder names (for smoke / doctor lines). */
  readonly skillSample: readonly string[];
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
 * Read the current global-install status.
 *
 * @param paths - Resolved global paths.
 * @returns The {@link GlobalStatus}.
 * @example
 * const status = await readGlobalStatus(resolveGlobalPaths());
 */
export const readGlobalStatus = async (paths: GlobalPaths): Promise<GlobalStatus> => {
  let hasMemory = false;
  try {
    hasMemory = (await readFile(paths.memoryFile, 'utf8')).includes('BEGIN VYBEKIIT');
  } catch {
    hasMemory = false;
  }
  const managed = await listManagedSkillNames(paths.skillsDir);
  return {
    hasCommand: await exists(join(paths.commandsDir, 'vybekiit.md')),
    hasMemory,
    skillCount: managed.length,
    skillSample: sampleManagedSkillNames(managed),
  };
};

/**
 * Whether the global install is fully in place.
 *
 * @param status - A status snapshot.
 * @returns True when command, memory, and at least one skill are present.
 * @example
 * isGloballyInstalled(await readGlobalStatus(paths));
 */
export const isGloballyInstalled = (status: GlobalStatus): boolean =>
  status.hasCommand && status.hasMemory && status.skillCount > 0;
