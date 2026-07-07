import {
  DOCS_ONLY_PLATFORM_PROVIDERS,
  evaluatePlatformSkillsAudit,
  isPlatformSkillsAuditBlocking,
  normalizeSkillsRepoKey,
  PLATFORM_SKILLS_AUDIT_PROVIDERS,
} from '@vybekiit/agent-kit/catalogs/platformSkillsAudit';
import {
  checkBaseManifestParity,
  findDocsOnlyViolations,
  mergePlatformSkillsManifests,
  PLATFORM_SKILLS_BASE_MANIFEST,
} from '@vybekiit/agent-kit/catalogs/platformSkillsMerge';
import { describe, expect, it } from 'vitest';

describe('mergePlatformSkillsManifests', () => {
  it('returns base sources when template override is empty', () => {
    const merged = mergePlatformSkillsManifests({ sources: [] });
    expect(merged.sources.length).toBe(PLATFORM_SKILLS_BASE_MANIFEST.sources.length);
    expect(merged.sources.some((s) => s.repo === 'supabase/agent-skills')).toBe(true);
  });

  it('merges mobile expo override onto base', () => {
    const merged = mergePlatformSkillsManifests({
      sources: [{ repo: 'expo/skills', skills: ['*'] }],
    });
    expect(merged.sources.some((s) => s.repo === 'expo/skills')).toBe(true);
    expect(merged.sources.some((s) => s.repo === 'supabase/agent-skills')).toBe(true);
  });

  it('unions explicit skills for the same repo', () => {
    const merged = mergePlatformSkillsManifests({
      sources: [{ repo: 'supabase/agent-skills', skills: ['supabase'] }],
    });
    const supabase = merged.sources.find((s) => s.repo === 'supabase/agent-skills');
    expect(supabase?.skills).toContain('supabase');
    expect(supabase?.skills).toContain('supabase-postgres-best-practices');
  });
});

describe('checkBaseManifestParity', () => {
  it('passes when merged includes all base repos', () => {
    const merged = mergePlatformSkillsManifests({ sources: [] });
    expect(checkBaseManifestParity(merged)).toEqual([]);
  });
});

describe('findDocsOnlyViolations', () => {
  it('flags blocked provider fragments in manifest', () => {
    const violations = findDocsOnlyViolations(
      { sources: [{ repo: 'community/lemon-squeezy-skills', skills: ['x'] }] },
      ['lemon-squeezy'],
    );
    expect(violations.length).toBe(1);
  });
});

describe('evaluatePlatformSkillsAudit', () => {
  const now = new Date('2026-06-30T00:00:00Z');
  const recent = new Date('2026-06-01T00:00:00Z');
  const stale = new Date('2025-01-01T00:00:00Z');

  it('passes when repo and npm are fresh', () => {
    const repoCommitDates: Record<string, Date> = {};
    const npmPublishDates: Record<string, Date> = {};
    for (const p of PLATFORM_SKILLS_AUDIT_PROVIDERS) {
      repoCommitDates[normalizeSkillsRepoKey(p.skillsRepo)] = recent;
      if (p.npmPackage) {
        npmPublishDates[p.npmPackage] = recent;
      }
    }
    const results = evaluatePlatformSkillsAudit({ now, repoCommitDates, npmPublishDates });
    expect(isPlatformSkillsAuditBlocking(results)).toBe(false);
  });

  it('blocks when repo is stale', () => {
    const results = evaluatePlatformSkillsAudit({
      now,
      repoCommitDates: { 'supabase/agent-skills': stale },
      npmPublishDates: { '@supabase/supabase-js': recent },
    });
    const supabase = results.find((r) => r.provider === 'supabase');
    expect(supabase?.status).toBe('block');
  });

  it('blocks when npm is stale', () => {
    const results = evaluatePlatformSkillsAudit({
      now,
      repoCommitDates: { 'better-auth/skills': recent },
      npmPublishDates: { 'better-auth': stale },
    });
    const auth = results.find((r) => r.provider === 'better-auth');
    expect(auth?.status).toBe('block');
  });
});

describe('DOCS_ONLY_PLATFORM_PROVIDERS', () => {
  it('includes lemon-squeezy', () => {
    expect(DOCS_ONLY_PLATFORM_PROVIDERS.some((p) => p.id === 'lemon-squeezy')).toBe(true);
  });
});
