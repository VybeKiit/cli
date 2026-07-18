import { describe, expect, it } from 'vitest';
import { sampleManagedSkillNames } from '../../src/global/managedSkills';

describe('sampleManagedSkillNames', () => {
  it('prefers buyer-facing goal names when present', () => {
    const sample = sampleManagedSkillNames(
      ['add-ai', 'go-live', 'onboarding', 'setup-payments', 'zzz-other'],
      4,
    );
    expect(sample).toEqual(['onboarding', 'setup-payments', 'go-live', 'add-ai']);
  });

  it('returns empty for empty input', () => {
    expect(sampleManagedSkillNames([])).toEqual([]);
  });
});
