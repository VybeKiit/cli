import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatPlatformSkillsReport } from './platformSkills';

const missingSkillsReport = {
  ok: false,
  missing: ['supabase'],
  template: 'web',
  lockCount: 0,
};

describe('formatPlatformSkillsReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('points a buyer with missing skills at the update-kit request, not maintainer scripts', () => {
    const projectWithoutLock = mkdtempSync(join(tmpdir(), 'vk-platform-skills-'));
    vi.spyOn(process, 'cwd').mockReturnValue(projectWithoutLock);

    const doctorLines = formatPlatformSkillsReport(missingSkillsReport);
    const doctorText = doctorLines.join('\n');

    expect(doctorText).not.toContain('pin-platform-skills');
    expect(doctorText).not.toContain('pin script');
    expect(doctorLines.filter((line) => line.includes('"Update my kit."'))).toHaveLength(2);
  });
});
