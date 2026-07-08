import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expectedSkillNamesFromManifest } from '@vybekiit/agent-kit';
import { describe, expect, it } from 'vitest';
import { verifyPlatformSkills } from '../../src/doctor/platformSkills';

describe('platform skills verification', () => {
  it('returns ok when no manifest exists', () => {
    expect(verifyPlatformSkills('/nonexistent-path-xyz')).toEqual({
      ok: true,
      missing: [],
      template: null,
      lockCount: 0,
    });
  });

  it('flattens manifest skill sources', () => {
    expect(
      expectedSkillNamesFromManifest({
        sources: [{ repo: 'vercel-labs/agent-skills', skills: ['a', 'b'] }],
      }),
    ).toEqual(['a', 'b']);
  });

  it('verifies all skills-lock.json entries when lock exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'vyb-skills-'));
    try {
      writeFileSync(
        join(tmp, 'platform-skills.manifest.json'),
        JSON.stringify({ sources: [{ repo: 'x/y', skills: ['explicit-only'] }] }),
      );
      writeFileSync(
        join(tmp, 'skills-lock.json'),
        JSON.stringify({ version: 1, skills: { 'locked-skill': {}, 'missing-skill': {} } }),
      );
      mkdirSync(join(tmp, '.agents', 'skills', 'locked-skill'), { recursive: true });
      writeFileSync(join(tmp, '.agents', 'skills', 'locked-skill', 'SKILL.md'), '# locked\n');

      const report = verifyPlatformSkills(tmp);

      expect(report.ok).toBe(false);
      expect(report.missing).toEqual(['missing-skill']);
      expect(report.lockCount).toBe(2);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
