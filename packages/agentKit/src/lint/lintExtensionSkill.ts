export type ExtensionSkillLintKind = 'buyer-goal' | 'platform-wrapper' | 'agent-skills-global';

export interface ExtensionSkillLintIssue {
  readonly rule: string;
  readonly message: string;
}

export interface ExtensionSkillLintInput {
  readonly kind: ExtensionSkillLintKind;
  readonly content: string;
  readonly path?: string;
}

export interface ExtensionSkillLintReport {
  readonly ok: boolean;
  readonly issues: readonly ExtensionSkillLintIssue[];
}

const BUYER_GOAL_REQUIRED = [
  { rule: 'goal', pattern: /\*\*Goal:\*\*/ },
  { rule: 'contract', pattern: /\*\*Contract:\*\*/ },
  { rule: 'steps', pattern: /^## Steps/m },
  { rule: 'definition-of-done', pattern: /^## Definition of done/m },
] as const;

const PLATFORM_WRAPPER_REQUIRED = [
  { rule: 'kit-wiring', pattern: /^## Kit wiring/m },
  { rule: 'verify', pattern: /^## Verify-before-advance/m },
  { rule: 'never-say', pattern: /^## Never say to builder/m },
] as const;

function lintBuyerGoal(content: string): ExtensionSkillLintIssue[] {
  const issues: ExtensionSkillLintIssue[] = [];
  for (const req of BUYER_GOAL_REQUIRED) {
    if (!req.pattern.test(content)) {
      issues.push({
        rule: req.rule,
        message: `Buyer goal skill missing required section: ${req.rule}`,
      });
    }
  }
  if (!/\*\*Verify:\*\*/i.test(content)) {
    issues.push({
      rule: 'verify-before-advance',
      message: 'Buyer goal skill must include at least one **Verify:** checkpoint',
    });
  }
  if (!/one action at a time/i.test(content)) {
    issues.push({
      rule: 'contract-rules',
      message: 'Buyer goal skill must reference the five-rule contract',
    });
  }
  return issues;
}

function lintPlatformWrapper(content: string): ExtensionSkillLintIssue[] {
  const issues: ExtensionSkillLintIssue[] = [];
  for (const req of PLATFORM_WRAPPER_REQUIRED) {
    if (!req.pattern.test(content)) {
      issues.push({
        rule: req.rule,
        message: `Platform wrapper missing required section: ${req.rule}`,
      });
    }
  }
  if (content.trim().length < 100) {
    issues.push({ rule: 'min-length', message: 'Platform wrapper content is too short' });
  }
  return issues;
}

function lintAgentSkillsGlobal(content: string): ExtensionSkillLintIssue[] {
  const issues: ExtensionSkillLintIssue[] = [];
  if (!content.startsWith('---\n')) {
    issues.push({
      rule: 'frontmatter',
      message: 'Global skill must start with YAML frontmatter',
    });
    return issues;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    issues.push({
      rule: 'frontmatter',
      message: 'Global skill must have closing YAML frontmatter delimiter',
    });
    return issues;
  }
  const frontmatter = content.slice(4, end);
  if (!/^name:\s*[a-z0-9-]+\s*$/m.test(frontmatter)) {
    issues.push({ rule: 'name', message: 'Global skill frontmatter must include name:' });
  }
  if (!/^description:\s*.+$/m.test(frontmatter)) {
    issues.push({
      rule: 'description',
      message: 'Global skill frontmatter must include description:',
    });
  }
  const body = content.slice(end + 5).trim();
  if (body.length < 50) {
    issues.push({ rule: 'body', message: 'Global skill body is too short after frontmatter' });
  }
  return issues;
}

/** Lint an extension skill draft before persisting (agent-only gate). */
export function lintExtensionSkill(input: ExtensionSkillLintInput): ExtensionSkillLintReport {
  let issues: ExtensionSkillLintIssue[] = [];
  switch (input.kind) {
    case 'buyer-goal':
      issues = lintBuyerGoal(input.content);
      break;
    case 'platform-wrapper':
      issues = lintPlatformWrapper(input.content);
      break;
    case 'agent-skills-global':
      issues = lintAgentSkillsGlobal(input.content);
      break;
  }
  return { ok: issues.length === 0, issues };
}
