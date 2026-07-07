import { Effect } from 'effect';

/** One upstream source declared in `platform-skills.manifest.json`. */
export type PlatformSkillsSource = {
  readonly repo: string;
  readonly skills: readonly string[];
};

/** Parsed manifest shape (ignores `_notes`). */
export type PlatformSkillsManifest = {
  readonly sources: readonly PlatformSkillsSource[];
};

/** One skill entry from `skills-lock.json`. */
export type SkillsLockEntry = {
  readonly source: string;
  readonly sourceType: string;
  readonly skillPath: string;
  readonly computedHash: string;
};

/** Parsed `skills-lock.json` (version + skills map). */
export type SkillsLockFile = {
  readonly version: number;
  readonly skills: Readonly<Record<string, SkillsLockEntry>>;
};

/**
 * Expected skill names from a manifest. `"*"` means all skills from that repo are
 *
 * @param manifest - manifest input.
 * @returns The expected skill names from manifest entries.
 * @example
 * const result = expectedSkillNamesFromManifest(manifest);
 */
export const expectedSkillNamesFromManifest = (manifest: PlatformSkillsManifest): string[] => {
  const names: string[] = [];
  for (const source of manifest.sources) {
    if (!source.skills.includes('*')) {
      for (const skill of source.skills) {
        if (!names.includes(skill)) {
          names.push(skill);
        }
      }
    }
  }
  return names;
};

/**
 * Whether platform skills need refreshing. When the manifest lists explicit skill
 * names, any missing from the lock is stale. When the manifest uses `"*"`, any
 * non-empty lock is treated as up to date (buyer runs `npx skills update` on
 * update-kit regardless — this planner catches explicit manifest drift).
 */
export type PlatformSkillsUpdatePlan = {
  readonly upToDate: boolean;
  /** Skill names missing from the lock file. */
  readonly missing: readonly string[];
  /** Whether the lock file exists and has any skills. */
  readonly hasLock: boolean;
};

/**
 * Plan whether pinned platform skills look complete vs the manifest + lock.
 *
 * @param manifest - manifest input.
 * @param lock - lock input.
 * @returns Effect that succeeds with the platform skills update plan.
 * @example
 * const plan = Effect.runSync(planPlatformSkillsUpdate(manifest, lock));
 */
export const planPlatformSkillsUpdate = (
  manifest: PlatformSkillsManifest,
  lock: SkillsLockFile | null,
): Effect.Effect<PlatformSkillsUpdatePlan> => {
  const hasLock = lock !== null && Object.keys(lock.skills).length > 0;
  const usesWildcard = manifest.sources.some((s) => s.skills.includes('*'));

  if (manifest.sources.length === 0) {
    return Effect.succeed({ upToDate: true, missing: [], hasLock });
  }

  if (usesWildcard) {
    return Effect.succeed({ upToDate: hasLock, missing: [], hasLock });
  }

  const expected = expectedSkillNamesFromManifest(manifest);
  const installed = new Set(lock ? Object.keys(lock.skills) : []);
  const missing = expected.filter((name) => !installed.has(name));
  return Effect.succeed({
    upToDate: missing.length === 0 && hasLock,
    missing,
    hasLock,
  });
};

/**
 * Skill names pinned in skills-lock.json — source of truth for installed skills.
 *
 * @param lock - lock input.
 * @returns The expected skill names from lock entries.
 * @example
 * const result = expectedSkillNamesFromLock(lock);
 */
export const expectedSkillNamesFromLock = (lock: SkillsLockFile | null): string[] => {
  if (!lock?.skills) {
    return [];
  }
  return Object.keys(lock.skills);
};

/**
 * Returns true when the agent should run `npx skills update -y` during update-kit.
 *
 * @param plan - plan input.
 * @returns Whether should run platform skills update succeeds.
 * @example
 * const result = shouldRunPlatformSkillsUpdate(plan);
 */
export const shouldRunPlatformSkillsUpdate = (plan: PlatformSkillsUpdatePlan): boolean =>
  (!plan.hasLock && plan.missing.length > 0) ||
  !plan.upToDate ||
  (plan.hasLock && plan.missing.length === 0);
