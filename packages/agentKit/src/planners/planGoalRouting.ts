import {
  GOAL_ENTRIES,
  type GoalCatalogEntry,
  type TemplateId,
} from '@vybekiit/agent-kit/catalogs/goalCatalog';

export type GoalRoutingPlan = {
  readonly goalId: string;
  readonly skill: string;
  readonly skillPath: string;
  readonly available: boolean;
  readonly reason?: string;
};

export type GoalDriftIssue = {
  readonly goalId: string;
  readonly template: TemplateId;
  readonly skill: string;
  readonly skillPath: string;
  readonly issue: 'missing_skill' | 'unlisted_skill';
};

export type GoalDriftReport = {
  readonly template: TemplateId;
  readonly issues: readonly GoalDriftIssue[];
  readonly ok: boolean;
};

const normalizePhrase = (phrase: string): string => phrase.toLowerCase().trim();

const skillPathFor = (skillStem: string): string => `.vybekiit/skills/${skillStem}.md`;

const matchGoal = (phrase: string): GoalCatalogEntry | null => {
  const normalized = normalizePhrase(phrase);
  for (const entry of GOAL_ENTRIES) {
    if (entry.phrases.some((p) => normalized.includes(normalizePhrase(p)))) {
      return entry;
    }
  }
  return null;
};

/**
 * Route a builder phrase to the correct skill for a template.
 *
 * @param template - template input.
 * @param goalPhrase - goal phrase input.
 * @returns The plan goal routing result.
 * @example
 * const result = planGoalRouting(template, goalPhrase);
 */
export const planGoalRouting = (template: TemplateId, goalPhrase: string): GoalRoutingPlan => {
  const entry = matchGoal(goalPhrase);
  if (!entry) {
    return {
      goalId: 'unknown',
      skill: '',
      skillPath: '',
      available: false,
      reason: 'No matching goal in the catalog.',
    };
  }

  const skill = entry.skills[template];
  if (!skill) {
    return {
      goalId: entry.id,
      skill: '',
      skillPath: '',
      available: false,
      reason: `Goal "${entry.id}" is not available on the ${template} template.`,
    };
  }

  return {
    goalId: entry.id,
    skill,
    skillPath: skillPathFor(skill),
    available: true,
  };
};

/**
 * Check that every catalogued skill for a template exists in the provided skill file list.
 *
 * @param template - template input.
 * @param existingSkillPaths - existing skill paths input.
 * @returns The check goal drift result.
 * @example
 * const result = checkGoalDrift(template, existingSkillPaths);
 */
export const checkGoalDrift = (
  template: TemplateId,
  existingSkillPaths: readonly string[],
): GoalDriftReport => {
  const existing = new Set(existingSkillPaths.map((p) => p.replace(/\\/g, '/')));
  const issues: GoalDriftIssue[] = [];

  for (const entry of GOAL_ENTRIES) {
    const skill = entry.skills[template];
    if (typeof skill === 'string') {
      const path = skillPathFor(skill);
      if (!existing.has(path)) {
        issues.push({
          goalId: entry.id,
          template,
          skill,
          skillPath: path,
          issue: 'missing_skill',
        });
      }
    }
  }

  const catalogSkills = new Set(
    GOAL_ENTRIES.map((e) => e.skills[template]).filter((s): s is string => s !== null),
  );
  for (const path of existing) {
    if (path.startsWith('.vybekiit/skills/') && path.endsWith('.md')) {
      const stem = path.slice('.vybekiit/skills/'.length, -'.md'.length);
      if (!catalogSkills.has(stem)) {
        issues.push({
          goalId: stem,
          template,
          skill: stem,
          skillPath: path,
          issue: 'unlisted_skill',
        });
      }
    }
  }

  return { template, issues, ok: issues.length === 0 };
};
