import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/** How many managed skill names to surface in doctor / install smoke lines. */
export const GLOBAL_SKILL_SAMPLE_SIZE = 5;

/** Marker file written into each skill dir we own (see installGlobalSkills). */
export const MANAGED_SKILL_MARKER = '.vybekiit-managed';

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
 * List VybeKiit-managed skill folder names under a skills dir (sorted).
 *
 * A skill is managed when its directory carries the `.vybekiit-managed` marker.
 *
 * @param skillsDir - The global skills dir (usually ~/.claude/skills).
 * @returns Sorted skill names.
 * @example
 * const names = await listManagedSkillNames(paths.skillsDir);
 */
export const listManagedSkillNames = async (skillsDir: string): Promise<string[]> => {
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const names: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (await exists(join(skillsDir, entry.name, MANAGED_SKILL_MARKER))) {
        names.push(entry.name);
      }
    }
    names.sort((left, right) => left.localeCompare(right));
    return names;
  } catch {
    return [];
  }
};

/**
 * First N managed skill names for smoke lines (prefer buyer-facing anchors when present).
 *
 * @param names - Sorted managed skill names.
 * @param size - Max sample size (default {@link GLOBAL_SKILL_SAMPLE_SIZE}).
 * @returns Up to `size` names, preferring known buyer goals when they exist.
 */
export const sampleManagedSkillNames = (
  names: readonly string[],
  size: number = GLOBAL_SKILL_SAMPLE_SIZE,
): readonly string[] => {
  if (names.length === 0 || size <= 0) {
    return [];
  }
  // Prefer the goals buyers hear about in onboarding so the smoke line is recognizable.
  const preferred = [
    'feedback',
    'onboarding',
    'plan-my-idea',
    'setup-payments',
    'add-signin',
    'go-live',
    'harden',
    'doctor',
  ];
  const preferredHits = preferred.filter((name) => names.includes(name));
  const rest = names.filter((name) => !preferredHits.includes(name));
  return [...preferredHits, ...rest].slice(0, size);
};
