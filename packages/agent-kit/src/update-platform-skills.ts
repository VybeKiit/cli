import { type Result, ok } from '@vybekiit/core';

/** One upstream source declared in `platform-skills.manifest.json`. */
export interface PlatformSkillsSource {
  readonly repo: string;
  readonly skills: readonly string[];
}

/** Parsed manifest shape (ignores `_notes`). */
export interface PlatformSkillsManifest {
  readonly sources: readonly PlatformSkillsSource[];
}

/** One skill entry from `skills-lock.json`. */
export interface SkillsLockEntry {
  readonly source: string;
  readonly sourceType: string;
  readonly skillPath: string;
  readonly computedHash: string;
}

/** Parsed `skills-lock.json` (version + skills map). */
export interface SkillsLockFile {
  readonly version: number;
  readonly skills: Readonly<Record<string, SkillsLockEntry>>;
}

/**
 * Expected skill names from a manifest. `"*"` means all skills from that repo are
 * managed — the lock file is the source of truth for which names are installed.
 */
export function expectedSkillNamesFromManifest(manifest: PlatformSkillsManifest): string[] {
  const names: string[] = [];
  for (const source of manifest.sources) {
    if (source.skills.includes('*')) {
      continue;
    }
    for (const skill of source.skills) {
      if (!names.includes(skill)) names.push(skill);
    }
  }
  return names;
}

/**
 * Whether platform skills need refreshing. When the manifest lists explicit skill
 * names, any missing from the lock is stale. When the manifest uses `"*"`, any
 * non-empty lock is treated as up to date (buyer runs `npx skills update` on
 * update-kit regardless — this planner catches explicit manifest drift).
 */
export interface PlatformSkillsUpdatePlan {
  readonly upToDate: boolean;
  /** Skill names missing from the lock file. */
  readonly missing: readonly string[];
  /** Whether the lock file exists and has any skills. */
  readonly hasLock: boolean;
}

/**
 * Plan whether pinned platform skills look complete vs the manifest + lock.
 * Backs the update-kit skill's decision to run `npx skills update`.
 */
export function planPlatformSkillsUpdate(
  manifest: PlatformSkillsManifest,
  lock: SkillsLockFile | null,
): Result<PlatformSkillsUpdatePlan> {
  const hasLock = lock !== null && Object.keys(lock.skills).length > 0;
  const usesWildcard = manifest.sources.some((s) => s.skills.includes('*'));

  if (manifest.sources.length === 0) {
    return ok({ upToDate: true, missing: [], hasLock });
  }

  if (usesWildcard) {
    return ok({ upToDate: hasLock, missing: [], hasLock });
  }

  const expected = expectedSkillNamesFromManifest(manifest);
  const installed = new Set(lock ? Object.keys(lock.skills) : []);
  const missing = expected.filter((name) => !installed.has(name));
  return ok({
    upToDate: missing.length === 0 && hasLock,
    missing,
    hasLock,
  });
}

/**
 * Returns true when the agent should run `npx skills update -y` during update-kit.
 * Wildcard manifests always suggest update when a lock exists; explicit manifests
 * when anything is missing or lock is absent.
 */
export function shouldRunPlatformSkillsUpdate(plan: PlatformSkillsUpdatePlan): boolean {
  if (!plan.hasLock && plan.missing.length > 0) return true;
  if (!plan.upToDate) return true;
  if (plan.hasLock && plan.missing.length === 0) return true;
  return false;
}
