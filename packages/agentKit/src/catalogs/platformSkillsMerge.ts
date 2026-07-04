import type {
  PlatformSkillsManifest,
  PlatformSkillsSource,
} from '@vybekiit/agentKit/planners/updatePlatformSkills';
import baseManifest from './platform-skills-base.manifest.json' with { type: 'json' };

export { baseManifest as PLATFORM_SKILLS_BASE_MANIFEST };

export interface PlatformSkillsTemplateManifest extends PlatformSkillsManifest {
  readonly _notes?: Readonly<Record<string, string>>;
}

function mergeSkillLists(a: readonly string[], b: readonly string[]): string[] {
  const merged = new Set<string>([...a, ...b]);
  if (merged.has('*')) return ['*'];
  return [...merged];
}

function sourceKey(source: PlatformSkillsSource): string {
  return source.repo;
}

/**
 * Merge shared base manifest with per-template overrides.
 * Same repo → union skill names; `"*"` wins for that repo.
 */
export function mergePlatformSkillsManifests(
  templateManifest: PlatformSkillsTemplateManifest,
  base: PlatformSkillsManifest = baseManifest as PlatformSkillsManifest,
): PlatformSkillsManifest {
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
}

/** Every repo from the base manifest must appear in the merged manifest. */
export function checkBaseManifestParity(
  merged: PlatformSkillsManifest,
  base: PlatformSkillsManifest = baseManifest as PlatformSkillsManifest,
): string[] {
  const mergedRepos = new Set(merged.sources.map((s) => s.repo));
  const missing: string[] = [];
  for (const source of base.sources) {
    if (!mergedRepos.has(source.repo)) {
      missing.push(source.repo);
    }
  }
  return missing;
}

/** Docs-only provider repos must not be in the base manifest. */
export function findDocsOnlyViolations(
  manifest: PlatformSkillsManifest,
  blockedRepoFragments: readonly string[],
): string[] {
  const violations: string[] = [];
  for (const source of manifest.sources) {
    for (const fragment of blockedRepoFragments) {
      if (source.repo.toLowerCase().includes(fragment.toLowerCase())) {
        violations.push(`${fragment} found in manifest repo ${source.repo}`);
      }
    }
  }
  return violations;
}
