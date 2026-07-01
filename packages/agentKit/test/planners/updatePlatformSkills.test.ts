import { describe, expect, it } from 'vitest';
import {
  expectedSkillNamesFromManifest,
  planPlatformSkillsUpdate,
  shouldRunPlatformSkillsUpdate,
} from '../../src/planners/update-platform-skills';

describe('planPlatformSkillsUpdate', () => {
  it('reports up to date when manifest has no sources', () => {
    const result = planPlatformSkillsUpdate({ sources: [] }, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(true);
  });

  it('flags missing skills for explicit manifest entries', () => {
    const manifest = {
      sources: [{ repo: 'vercel-labs/agent-skills', skills: ['a', 'b'] }],
    };
    const lock = {
      version: 1,
      skills: {
        a: { source: 'x', sourceType: 'github', skillPath: 'a/SKILL.md', computedHash: 'h' },
      },
    };
    const result = planPlatformSkillsUpdate(manifest, lock);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.upToDate).toBe(false);
    expect(result.value.missing).toEqual(['b']);
  });

  it('wildcard manifest treats non-empty lock as manageable', () => {
    const manifest = { sources: [{ repo: 'expo/skills', skills: ['*'] }] };
    const lock = {
      version: 1,
      skills: {
        foo: { source: 'expo/skills', sourceType: 'github', skillPath: 'x', computedHash: 'h' },
      },
    };
    const result = planPlatformSkillsUpdate(manifest, lock);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasLock).toBe(true);
  });
});

describe('expectedSkillNamesFromManifest', () => {
  it('expands explicit skill names and skips wildcard', () => {
    expect(
      expectedSkillNamesFromManifest({
        sources: [
          { repo: 'a/b', skills: ['one'] },
          { repo: 'c/d', skills: ['*'] },
        ],
      }),
    ).toEqual(['one']);
  });
});

describe('shouldRunPlatformSkillsUpdate', () => {
  it('suggests update when lock exists and plan is up to date', () => {
    expect(
      shouldRunPlatformSkillsUpdate({
        upToDate: true,
        missing: [],
        hasLock: true,
      }),
    ).toBe(true);
  });
});
