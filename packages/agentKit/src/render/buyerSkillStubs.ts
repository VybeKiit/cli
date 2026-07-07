import { GOAL_ENTRIES, type TemplateId } from '@vybekiit/agent-kit/catalogs/goalCatalog';

/** Marker in generated `.agents/skills/<goal>/SKILL.md` bodies — do not edit by hand. */
export const BUYER_SKILL_STUB_MARKER = 'vybekiit:generated:buyer-skill-stub';

export const AGENT_SKILL_SYMLINKS = [
  { link: '.claude/skills', target: '../.agents/skills' },
  { link: '.cursor/skills', target: '../.agents/skills' },
] as const;

export type BuyerSkillStubOutput = {
  readonly skillStem: string;
  readonly buyerPath: string;
  readonly stubPath: string;
  readonly content: string;
};

export type BuyerSkillStubDriftIssue = {
  readonly skillStem: string;
  readonly buyerPath: string;
  readonly stubPath: string;
  readonly issue: 'missing_stub' | 'stub_drift' | 'invalid_stub_name';
};

export type BuyerSkillStubDriftReport = {
  readonly issues: readonly BuyerSkillStubDriftIssue[];
  readonly ok: boolean;
};

// "go-live" -> true, "Go Live" -> false
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ".vybekiit/skills/go-live.md" -> "go-live"
const BUYER_SKILL_PATH_PATTERN = /^\.vybekiit\/skills\/([a-z0-9-]+)\.md$/;

// "**Goal:** Go live\n" -> "Go live"
const BUYER_GOAL_PATTERN = /\*\*Goal:\*\*\s*(.+?)(?:\n|$)/;

// "Go   live" -> "Go live"
const WHITESPACE_PATTERN = /\s+/g;

// "Go live." -> "Go live"
const TRAILING_PERIOD_PATTERN = /\.$/;

// "name: go-live" -> "go-live"
const STUB_NAME_PATTERN = /^name:\s*([a-z0-9-]+)\s*$/m;

// "foo\\bar" -> "foo/bar"
const WINDOWS_PATH_SEPARATOR_PATTERN = /\\/g;

const MAX_DESCRIPTION = 1024;

/**
 * Path relative to project root, e.g. `.vybekiit/skills/go-live.md`.
 *
 * @param path - path input.
 * @returns The buyer skill stem from path result.
 * @example
 * const result = buyerSkillStemFromPath(path);
 */
export const buyerSkillStemFromPath = (path: string): string | null => {
  const normalized = path.replace(WINDOWS_PATH_SEPARATOR_PATTERN, '/');
  const match = normalized.match(BUYER_SKILL_PATH_PATTERN);
  if (match === null) {
    return null;
  }
  const [, stem] = match;
  return stem === undefined ? null : stem;
};

/**
 * Run buyer skill stub path.
 *
 * @param skillStem - skill stem input.
 * @returns The rendered buyer skill stub path text.
 * @example
 * const result = buyerSkillStubPath(skillStem);
 */
export const buyerSkillStubPath = (skillStem: string): string =>
  `.agents/skills/${skillStem}/SKILL.md`;

/**
 * Run parse buyer skill goal.
 *
 * @param content - content input.
 * @returns The parse buyer skill goal result.
 * @example
 * const result = parseBuyerSkillGoal(content);
 */
export const parseBuyerSkillGoal = (content: string): string | null => {
  const match = content.match(BUYER_GOAL_PATTERN);
  if (match === null) {
    return null;
  }
  const [, goal] = match;
  return goal === undefined ? null : goal.trim();
};

/**
 * Trigger phrases from goal-catalog entries that route to this skill stem.
 *
 * @param skillStem - skill stem input.
 * @param template - template input.
 * @returns The lookup buyer skill trigger phrases entries.
 * @example
 * const result = lookupBuyerSkillTriggerPhrases(skillStem, template);
 */
export const lookupBuyerSkillTriggerPhrases = (
  skillStem: string,
  template: TemplateId,
): readonly string[] => {
  const phrases = new Set<string>();
  for (const entry of GOAL_ENTRIES) {
    if (entry.skills[template] === skillStem) {
      for (const phrase of entry.phrases) {
        phrases.add(phrase);
      }
    }
  }
  return [...phrases];
};

const sanitizeDescriptionLine = (text: string): string =>
  text.replace(WHITESPACE_PATTERN, ' ').trim();

/**
 * Build Agent Skills `description` from Goal line + catalog trigger phrases.
 *
 * @param skillStem - skill stem input.
 * @param goalText - goal text input.
 * @param template - template input.
 * @returns The rendered render buyer skill description text.
 * @example
 * const result = renderBuyerSkillDescription(skillStem, goalText, template);
 */
export const renderBuyerSkillDescription = (
  skillStem: string,
  goalText: string,
  template: TemplateId,
): string => {
  const goal = sanitizeDescriptionLine(goalText.replace(TRAILING_PERIOD_PATTERN, ''));
  const phrases = lookupBuyerSkillTriggerPhrases(skillStem, template);
  const when =
    phrases.length > 0
      ? ` Use when the builder says something like: ${phrases.slice(0, 6).join('; ')}.`
      : '';
  const description = `${goal}.${when}`;
  return description.length <= MAX_DESCRIPTION
    ? description
    : `${description.slice(0, MAX_DESCRIPTION - 1)}…`;
};

/**
 * Full-duplicate Agent Skills stub from a buyer skill markdown file.
 *
 * @param skillStem - skill stem input.
 * @param buyerContent - buyer content input.
 * @param template - template input.
 * @returns The rendered render buyer skill stub text.
 * @example
 * const result = renderBuyerSkillStub(skillStem, buyerContent, template);
 */
export const renderBuyerSkillStub = (
  skillStem: string,
  buyerContent: string,
  template: TemplateId,
): string => {
  if (!SKILL_NAME_PATTERN.test(skillStem)) {
    throw new Error(`Invalid buyer skill stem for Agent Skills name: ${skillStem}`);
  }
  const parsedGoal = parseBuyerSkillGoal(buyerContent);
  const goal = parsedGoal === null ? skillStem : parsedGoal;
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
};

export type AgentSkillSymlinkIssue = {
  readonly link: string;
  readonly issue: 'missing' | 'not_symlink' | 'wrong_target';
  readonly expectedTarget: string;
  readonly actualTarget?: string;
};

export type AgentSkillSymlinkReport = {
  readonly issues: readonly AgentSkillSymlinkIssue[];
  readonly ok: boolean;
};

export type AgentSkillSymlinkState = {
  readonly isSymlink: boolean;
  readonly target: string | null;
};

export type AgentSkillSymlinkPlan = {
  readonly toCreate: readonly { readonly link: string; readonly target: string }[];
  readonly report: AgentSkillSymlinkReport;
};

/**
 * Plan symlink creates from on-disk state — pure; CLI adapters read/write fs.
 *
 * @param states - states input.
 * @returns The plan agent skill symlinks result.
 * @example
 * const result = planAgentSkillSymlinks(states);
 */
export const planAgentSkillSymlinks = (
  states: Readonly<Record<string, AgentSkillSymlinkState>>,
): AgentSkillSymlinkPlan => {
  const report = checkAgentSkillSymlinks(states);
  const toCreate = AGENT_SKILL_SYMLINKS.filter(({ link, target }) => {
    const state = states[link];
    return !state?.isSymlink || state.target !== target;
  }).map(({ link, target }) => ({ link, target }));
  return { toCreate, report };
};

/**
 * Validate `.claude/skills` and `.cursor/skills` symlinks point at `.agents/skills`.
 *
 * @param states - states input.
 * @returns The check agent skill symlinks result.
 * @example
 * const result = checkAgentSkillSymlinks(states);
 */
export const checkAgentSkillSymlinks = (
  states: Readonly<Record<string, { readonly isSymlink: boolean; readonly target: string | null }>>,
): AgentSkillSymlinkReport => {
  const issues: AgentSkillSymlinkIssue[] = [];

  for (const { link, target } of AGENT_SKILL_SYMLINKS) {
    const state = states[link];
    if (!state) {
      issues.push({ link, issue: 'missing', expectedTarget: target });
    } else if (!state.isSymlink) {
      issues.push({ link, issue: 'not_symlink', expectedTarget: target });
    } else if (state.target !== target) {
      issues.push({
        link,
        issue: 'wrong_target',
        expectedTarget: target,
        ...(state.target === null ? {} : { actualTarget: state.target }),
      });
    }
  }

  return { issues, ok: issues.length === 0 };
};

const parseStubName = (content: string): string | null => {
  const match = content.match(STUB_NAME_PATTERN);
  if (match === null) {
    return null;
  }
  const [, name] = match;
  return name === undefined ? null : name;
};

/**
 * Plan stub files to write for every buyer skill on disk (does not touch upstream pins).
 *
 * @param template - template input.
 * @param skillContents - skill contents input.
 * @returns The plan buyer skill stub outputs entries.
 * @example
 * const result = planBuyerSkillStubOutputs(template, skillContents);
 */
export const planBuyerSkillStubOutputs = (
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
): readonly BuyerSkillStubOutput[] => {
  const outputs: BuyerSkillStubOutput[] = [];
  for (const [buyerPath, content] of Object.entries(skillContents)) {
    const stem = buyerSkillStemFromPath(buyerPath);
    if (stem !== null) {
      outputs.push({
        skillStem: stem,
        buyerPath,
        stubPath: buyerSkillStubPath(stem),
        content: renderBuyerSkillStub(stem, content, template),
      });
    }
  }
  return outputs.sort((a, b) => a.skillStem.localeCompare(b.skillStem));
};

/**
 * Run is generated buyer skill stub.
 *
 * @param content - content input.
 * @returns Whether is generated buyer skill stub succeeds.
 * @example
 * const result = isGeneratedBuyerSkillStub(content);
 */
export const isGeneratedBuyerSkillStub = (content: string): boolean =>
  content.includes(BUYER_SKILL_STUB_MARKER);

/**
 * Fail when generated stubs are missing or drift from buyer skill sources.
 *
 * @param template - template input.
 * @param skillContents - skill contents input.
 * @param stubContents - stub contents input.
 * @returns The check buyer skill stub drift result.
 * @example
 * const result = checkBuyerSkillStubDrift(template, skillContents, stubContents);
 */
export const checkBuyerSkillStubDrift = (
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
  stubContents: Readonly<Record<string, string>>,
): BuyerSkillStubDriftReport => {
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
    } else if (!isGeneratedBuyerSkillStub(actual)) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'stub_drift',
      });
    } else if (parseStubName(actual) !== stub.skillStem) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'invalid_stub_name',
      });
    } else if (actual !== stub.content) {
      issues.push({
        skillStem: stub.skillStem,
        buyerPath: stub.buyerPath,
        stubPath: stub.stubPath,
        issue: 'stub_drift',
      });
    }
  }

  return { issues, ok: issues.length === 0 };
};
