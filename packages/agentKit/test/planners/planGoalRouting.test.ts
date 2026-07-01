import { describe, expect, it } from 'vitest';
import { GOAL_ENTRIES } from '../../src/catalogs/goalCatalog';
import { planGoalRouting, checkGoalDrift } from '../../src/planners/planGoalRouting';

describe('planGoalRouting', () => {
  it('routes onboarding phrase on web', () => {
    const plan = planGoalRouting('web', "let's start");
    expect(plan.available).toBe(true);
    expect(plan.skill).toBe('onboarding');
    expect(plan.skillPath).toBe('.vybekiit/skills/onboarding.md');
  });

  it('routes sign-in to connect-account on mobile', () => {
    const plan = planGoalRouting('mobile', 'let people sign in');
    expect(plan.available).toBe(true);
    expect(plan.skill).toBe('connect-account');
  });

  it('reports unavailable goals on extension', () => {
    const plan = planGoalRouting('extension', 'add a blog');
    expect(plan.available).toBe(false);
  });
});

describe('checkGoalDrift', () => {
  it('flags missing skills', () => {
    const report = checkGoalDrift('web', ['.vybekiit/skills/onboarding.md']);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.issue === 'missing_skill')).toBe(true);
  });

  it('passes when all catalog skills exist', () => {
    const stems = [
      ...new Set(
        GOAL_ENTRIES.map((entry) => entry.skills.web).filter((s): s is string => s !== null),
      ),
    ];
    const skills = stems.map((s) => `.vybekiit/skills/${s}.md`);
    const report = checkGoalDrift('web', skills);
    expect(report.issues.filter((i) => i.issue === 'missing_skill')).toHaveLength(0);
  });
});
