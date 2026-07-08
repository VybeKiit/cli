import type {
  PlatformSkillsManifest,
  PlatformSkillsSource,
} from '@vybekiit/agent-kit/planners/updatePlatformSkills';
import baseManifest from './platform-skills-base.manifest.json' with { type: 'json' };

export const PLATFORM_SKILLS_BASE_MANIFEST: PlatformSkillsManifest = baseManifest;

export type PlatformSkillsTemplateManifest = PlatformSkillsManifest & {
  readonly _notes?: Readonly<Record<string, string>>;
};

const mergeSkillLists = (a: readonly string[], b: readonly string[]): string[] => {
  const merged = new Set<string>([...a, ...b]);
  if (merged.has('*')) {
    return ['*'];
  }
  return [...merged];
};

const sourceKey = (source: PlatformSkillsSource): string => source.repo;

/**
 * Merge shared base manifest with per-template overrides.
 *
 * @param templateManifest - template manifest input.
 * @param base - base input.
 * @returns The merge platform skills manifests result.
 * @example
 * const result = mergePlatformSkillsManifests(templateManifest, base);
 */
export const mergePlatformSkillsManifests = (
  templateManifest: PlatformSkillsTemplateManifest,
  base: PlatformSkillsManifest = PLATFORM_SKILLS_BASE_MANIFEST,
): PlatformSkillsManifest => {
  const byRepo = new Map<string, PlatformSkillsSource>();

  for (const source of base.sources) {
    byRepo.set(sourceKey(source), { repo: source.repo, skills: [...source.skills] });
  }

  for (const source of templateManifest.sources) {
    const key = sourceKey(source);
    const existing = byRepo.get(key);
    if (existing) {
      byRepo.set(key, {
        repo: source.repo,
        skills: mergeSkillLists(existing.skills, source.skills),
      });
    } else {
      byRepo.set(key, { repo: source.repo, skills: [...source.skills] });
    }
  }

  return { sources: [...byRepo.values()] };
};

/**
 * Every repo from the base manifest must appear in the merged manifest.
 *
 * @param merged - merged input.
 * @param base - base input.
 * @returns The check base manifest parity entries.
 * @example
 * const result = checkBaseManifestParity(merged, base);
 */
export const checkBaseManifestParity = (
  merged: PlatformSkillsManifest,
  base: PlatformSkillsManifest = PLATFORM_SKILLS_BASE_MANIFEST,
): string[] => {
  const mergedRepos = new Set(merged.sources.map((s) => s.repo));
  const missing: string[] = [];
  for (const source of base.sources) {
    if (!mergedRepos.has(source.repo)) {
      missing.push(source.repo);
    }
  }
  return missing;
};

/**
 * Docs-only provider repos must not be in the base manifest.
 *
 * @param manifest - manifest input.
 * @param blockedRepoFragments - blocked repo fragments input.
 * @returns The find docs only violations entries.
 * @example
 * const result = findDocsOnlyViolations(manifest, blockedRepoFragments);
 */
export const findDocsOnlyViolations = (
  manifest: PlatformSkillsManifest,
  blockedRepoFragments: readonly string[],
): string[] => {
  const violations: string[] = [];
  for (const source of manifest.sources) {
    for (const fragment of blockedRepoFragments) {
      if (source.repo.toLowerCase().includes(fragment.toLowerCase())) {
        violations.push(`${fragment} found in manifest repo ${source.repo}`);
      }
    }
  }
  return violations;
};
