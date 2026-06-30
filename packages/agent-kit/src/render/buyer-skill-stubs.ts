import { GOAL_ENTRIES, type TemplateId } from '../catalogs/goal-catalog';

/** Marker in generated `.agents/skills/<goal>/SKILL.md` bodies — do not edit by hand. */
export const BUYER_SKILL_STUB_MARKER = 'vybekiit:generated:buyer-skill-stub';

export const AGENT_SKILL_SYMLINKS = [
  { link: '.claude/skills', target: '../.agents/skills' },
  { link: '.cursor/skills', target: '../.agents/skills' },
] as const;

export interface BuyerSkillStubOutput {
  readonly skillStem: string;
  readonly buyerPath: string;
  readonly stubPath: string;
  readonly content: string;
}

export interface BuyerSkillStubDriftIssue {
  readonly skillStem: string;
  readonly buyerPath: string;
  readonly stubPath: string;
  readonly issue: 'missing_stub' | 'stub_drift' | 'invalid_stub_name';
}

export interface BuyerSkillStubDriftReport {
  readonly issues: readonly BuyerSkillStubDriftIssue[];
  readonly ok: boolean;
}

const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_DESCRIPTION = 1024;

/** Path relative to project root, e.g. `.vybekiit/skills/go-live.md`. */
export function buyerSkillStemFromPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/');
  const match = normalized.match(/^\.vybekiit\/skills\/([a-z0-9-]+)\.md$/);
  return match?.[1] ?? null;
}

export function buyerSkillStubPath(skillStem: string): string {
  return `.agents/skills/${skillStem}/SKILL.md`;
}

export function parseBuyerSkillGoal(content: string): string | null {
  const match = content.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/);
  return match?.[1]?.trim() ?? null;
}

/** Trigger phrases from goal-catalog entries that route to this skill stem. */
export function lookupBuyerSkillTriggerPhrases(
  skillStem: string,
  template: TemplateId,
): readonly string[] {
  const phrases = new Set<string>();
  for (const entry of GOAL_ENTRIES) {
    if (entry.skills[template] === skillStem) {
      for (const phrase of entry.phrases) {
        phrases.add(phrase);
      }
    }
  }
  return [...phrases];
}

function sanitizeDescriptionLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Build Agent Skills `description` from Goal line + catalog trigger phrases. */
export function renderBuyerSkillDescription(
  skillStem: string,
  goalText: string,
  template: TemplateId,
): string {
  const goal = sanitizeDescriptionLine(goalText.replace(/\.$/, ''));
  const phrases = lookupBuyerSkillTriggerPhrases(skillStem, template);
  const when =
    phrases.length > 0
      ? ` Use when the builder says something like: ${phrases.slice(0, 6).join('; ')}.`
      : '';
  const description = `${goal}.${when}`;
  return description.length <= MAX_DESCRIPTION
    ? description
    : `${description.slice(0, MAX_DESCRIPTION - 1)}…`;
}

/** Full-duplicate Agent Skills stub from a buyer skill markdown file. */
export function renderBuyerSkillStub(
  skillStem: string,
  buyerContent: string,
  template: TemplateId,
): string {
  if (!SKILL_NAME_RE.test(skillStem)) {
    throw new Error(`Invalid buyer skill stem for Agent Skills name: ${skillStem}`);
  }
  const goal = parseBuyerSkillGoal(buyerContent) ?? skillStem;
  const description = renderBuyerSkillDescription(skillStem, goal, template);
  return [
    '---',
    `name: ${skillStem}`,
    `description: ${description}`,
    'metadata:',
    '  vybekiit-generated: buyer-skill-stub',
    '---',
    '',
    `<!-- ${BUYER_SKILL_STUB_MARKER} -->`,
    '',
    buyerContent.trimEnd(),
    '',
  ].join('\n');
}

export interface AgentSkillSymlinkIssue {
  readonly link: string;
  readonly issue: 'missing' | 'not_symlink' | 'wrong_target';
  readonly expectedTarget: string;
  readonly actualTarget?: string;
}

export interface AgentSkillSymlinkReport {
  readonly issues: readonly AgentSkillSymlinkIssue[];
  readonly ok: boolean;
}

export interface AgentSkillSymlinkState {
  readonly isSymlink: boolean;
  readonly target: string | null;
}

export interface AgentSkillSymlinkPlan {
  readonly toCreate: readonly { readonly link: string; readonly target: string }[];
  readonly report: AgentSkillSymlinkReport;
}

/** Plan symlink creates from on-disk state — pure; CLI adapters read/write fs. */
export function planAgentSkillSymlinks(
  states: Readonly<Record<string, AgentSkillSymlinkState>>,
): AgentSkillSymlinkPlan {
  const report = checkAgentSkillSymlinks(states);
  const toCreate = AGENT_SKILL_SYMLINKS.filter(({ link, target }) => {
    const state = states[link];
    return !state?.isSymlink || state.target !== target;
  }).map(({ link, target }) => ({ link, target }));
  return { toCreate, report };
}

/** Validate `.claude/skills` and `.cursor/skills` symlinks point at `.agents/skills`. */
export function checkAgentSkillSymlinks(
  states: Readonly<Record<string, { readonly isSymlink: boolean; readonly target: string | null }>>,
): AgentSkillSymlinkReport {
  const issues: AgentSkillSymlinkIssue[] = [];

  for (const { link, target } of AGENT_SKILL_SYMLINKS) {
    const state = states[link];
    if (!state) {
      issues.push({ link, issue: 'missing', expectedTarget: target });
      continue;
    }
    if (!state.isSymlink) {
      issues.push({ link, issue: 'not_symlink', expectedTarget: target });
      continue;
    }
    if (state.target !== target) {
      issues.push({
        link,
        issue: 'wrong_target',
        expectedTarget: target,
        ...(state.target === null ? {} : { actualTarget: state.target }),
      });
    }
  }

  return { issues, ok: issues.length === 0 };
}

function parseStubName(content: string): string | null {
  const match = content.match(/^name:\s*([a-z0-9-]+)\s*$/m);
  return match?.[1] ?? null;
}

/** Plan stub files to write for every buyer skill on disk (does not touch upstream pins). */
export function planBuyerSkillStubOutputs(
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
): readonly BuyerSkillStubOutput[] {
  const outputs: BuyerSkillStubOutput[] = [];
  for (const [buyerPath, content] of Object.entries(skillContents)) {
    const stem = buyerSkillStemFromPath(buyerPath);
    if (!stem) continue;
    outputs.push({
      skillStem: stem,
      buyerPath,
      stubPath: buyerSkillStubPath(stem),
      content: renderBuyerSkillStub(stem, content, template),
    });
  }
  return outputs.sort((a, b) => a.skillStem.localeCompare(b.skillStem));
}

export function isGeneratedBuyerSkillStub(content: string): boolean {
  return content.includes(BUYER_SKILL_STUB_MARKER);
}

/** Fail when generated stubs are missing or drift from buyer skill sources. */
export function checkBuyerSkillStubDrift(
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
  stubContents: Readonly<Record<string, string>>,
): BuyerSkillStubDriftReport {
  const issues: BuyerSkillStubDriftIssue[] = [];
  const expected = planBuyerSkillStubOutputs(template, skillContents);

  for (const stub of expected) {
    const actual = stubContents[stub.stubPath];
    if (actual === undefined) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'missing_stub',
      });
      continue;
    }
    if (!isGeneratedBuyerSkillStub(actual)) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'stub_drift',
      });
      continue;
    }
    const stubName = parseStubName(actual);
    if (stubName !== stub.skillStem) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'invalid_stub_name',
      });
      continue;
    }
    if (actual !== stub.content) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'stub_drift',
      });
    }
  }

  return { issues, ok: issues.length === 0 };
}
