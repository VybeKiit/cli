import { type GlobalPaths, resolveGlobalPaths } from '../global/globalPaths';
import {
  type GlobalStatus,
  isGloballyInstalled,
  readGlobalStatus as readGlobalStatusAt,
} from '../global/globalStatus';

export type { GlobalStatus } from '../global/globalStatus';
export { isGloballyInstalled } from '../global/globalStatus';
export {
  GLOBAL_SKILL_SAMPLE_SIZE,
  listManagedSkillNames,
  sampleManagedSkillNames,
} from '../global/managedSkills';

/**
 * Read the current global-install status (defaults to real ~/.claude paths).
 *
 * @param paths - Resolved global paths (defaults to the real ones).
 * @returns The {@link GlobalStatus}.
 * @example
 * const status = await readGlobalStatus();
 */
export const readGlobalStatus = async (
  paths: GlobalPaths = resolveGlobalPaths(),
): Promise<GlobalStatus> => readGlobalStatusAt(paths);

/**
 * Format the doctor status line for the global install.
 *
 * Missing managed skills is a hard signal: doctor should treat this as not set up and the
 * exit gate blocks until the buyer runs setup / global-install.
 *
 * @param status - A status snapshot.
 * @returns One line for the doctor report.
 */
export const formatGlobalStatus = (status: GlobalStatus): string => {
  if (isGloballyInstalled(status)) {
    const sample = status.skillSample.length > 0 ? ` e.g. ${status.skillSample.join(', ')}` : '';
    return `✓ VybeKiit global - active in every project (${status.skillCount} skills${sample}; /vybekiit command; Claude is aware).`;
  }
  return '✗ VybeKiit global - not set up yet (no managed skills in ~/.claude/skills). Run `vybekiit setup` or `vybekiit global-install --yes` so Claude Code loads kit skills in every project.';
};
