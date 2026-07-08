// biome-ignore lint/style/noExcessiveLinesPerFile: Runtime compliance is a single ordered matrix of agent pointer checks.
import { AGENT_RUNTIME_DOC_SOURCES } from '@vybekiit/agent-kit/catalogs/agentRuntimeDocSources';

export type AgentRuntimeComplianceCheckId =
  | 'runtime-docs-live'
  | 'claude-pointer'
  | 'cursor-rule'
  | 'agents-ssot'
  | 'buyer-skill-format'
  | 'platform-skill-wrapper'
  | 'copilot-instructions'
  | 'kiro-steering'
  | 'windsurf-rules'
  | 'cline-rules'
  | 'amazonq-rules'
  | 'continue-rules'
  | 'junie-pointer'
  | 'gemini-styleguide'
  | 'aider-conventions'
  | 'augment-rules'
  | 'roo-rules'
  | 'gemini-cli-md'
  | 'trae-rules'
  | 'antigravity-rules'
  | 'replit-md'
  | 'devin-rules'
  | 'opencode-rules'
  | 'zed-instructions';

export type AgentRuntimeComplianceIssue = {
  readonly check: AgentRuntimeComplianceCheckId;
  readonly message: string;
  readonly file?: string;
  /** 'error' blocks ok, 'warn' is advisory (e.g. optional pointer not yet added). */
  readonly severity: 'error' | 'warn';
};

export type AgentRuntimeComplianceInput = {
  readonly files: Readonly<Record<string, string>>;
  readonly skillContents: Readonly<Record<string, string>>;
  readonly platformSkillContents: Readonly<Record<string, string>>;
  /** Live-fetched doc bodies keyed by {@link AGENT_RUNTIME_DOC_SOURCES} id. */
  readonly liveDocs?: Readonly<Record<string, string>>;
};

export type AgentRuntimeComplianceReport = {
  readonly issues: readonly AgentRuntimeComplianceIssue[];
  readonly ok: boolean;
};

type PointerFileRequirement = {
  readonly check: AgentRuntimeComplianceCheckId;
  readonly file: string;
};

// "## Steps" -> true, "## Notes" -> false
const BUYER_SKILL_STEPS_HEADERS = /^## (Steps|How to run|When to run)/m;

// "---\nalwaysApply: true\n---" -> frontmatter block
const MDC_FRONTMATTER = /^---\n[\s\S]*?\n---/;

// "alwaysApply: true" -> ["alwaysApply", "true"]
const MDC_FRONTMATTER_FIELD_PATTERN = /^(\w+):\s*(.+)$/;

// "See AGENTS.md" -> true
const AGENTS_POINTER_PATTERN = /AGENTS\.md/i;

// "single source of truth" -> true
const SINGLE_SOURCE_OF_TRUTH_PATTERN = /single source of truth/i;

// "thin pointer" -> true
const THIN_POINTER_PATTERN = /thin pointer/i;

// "SSOT" -> true
const SSOT_PATTERN = /SSOT/i;

// "**Goal:** Set up payments" -> true
const BUYER_SKILL_GOAL_PATTERN = /\*\*Goal:\*\*/;

// "**Contract:** one action" -> true
const BUYER_SKILL_CONTRACT_PATTERN = /\*\*Contract:\*\*/;

const POINTER_FILE_REQUIREMENTS: readonly PointerFileRequirement[] = [
  { check: 'copilot-instructions', file: '.github/copilot-instructions.md' },
  { check: 'kiro-steering', file: '.kiro/steering/vybekiit.md' },
  { check: 'windsurf-rules', file: '.windsurf/rules/vybekiit.md' },
  { check: 'cline-rules', file: '.clinerules/vybekiit.md' },
  { check: 'amazonq-rules', file: '.amazonq/rules/vybekiit.md' },
  { check: 'continue-rules', file: '.continue/rules/vybekiit.md' },
  { check: 'junie-pointer', file: '.junie/AGENTS.md' },
  { check: 'gemini-styleguide', file: '.gemini/styleguide.md' },
  { check: 'aider-conventions', file: 'CONVENTIONS.md' },
  { check: 'augment-rules', file: '.augment/rules/vybekiit.md' },
  { check: 'roo-rules', file: '.roo/rules/vybekiit.md' },
  { check: 'gemini-cli-md', file: 'GEMINI.md' },
  { check: 'trae-rules', file: '.trae/rules/vybekiit.md' },
  { check: 'antigravity-rules', file: '.agent/rules/vybekiit.md' },
  { check: 'replit-md', file: 'replit.md' },
  { check: 'devin-rules', file: '.devin/rules.md' },
  { check: 'opencode-rules', file: '.opencode/rules.md' },
  { check: 'zed-instructions', file: '.zed/instructions.md' },
];

const parseMdcFrontmatter = (content: string): Record<string, string> => {
  const match = content.match(MDC_FRONTMATTER);
  if (!match) {
    return {};
  }
  const [block] = match;
  if (block === undefined) {
    return {};
  }
  const fields: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const kv = line.match(MDC_FRONTMATTER_FIELD_PATTERN);
    if (kv !== null) {
      const [, key, value] = kv;
      if (key !== undefined && value !== undefined) {
        fields[key] = value.trim();
      }
    }
  }
  return fields;
};

const validateLiveDocs = (
  liveDocs: Readonly<Record<string, string>> | undefined,
): AgentRuntimeComplianceIssue[] => {
  if (liveDocs === undefined) {
    return [];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  for (const source of AGENT_RUNTIME_DOC_SOURCES) {
    const body = liveDocs[source.id];
    if (body === undefined || body.length === 0) {
      issues.push({
        check: 'runtime-docs-live',
        message: `Missing live doc body for ${source.id} (${source.url})`,
        severity: 'error',
      });
    } else {
      for (const phrase of source.mustInclude) {
        if (!body.includes(phrase)) {
          issues.push({
            check: 'runtime-docs-live',
            message: `Official doc drift: ${source.id} no longer mentions "${phrase}" — update agent-runtime rules`,
            severity: 'error',
          });
        }
      }
    }
  }
  return issues;
};

const validateClaudePointer = (content: string | undefined): AgentRuntimeComplianceIssue[] => {
  if (content === undefined) {
    return [
      {
        check: 'claude-pointer',
        message: 'Missing CLAUDE.md',
        file: 'CLAUDE.md',
        severity: 'error',
      },
    ];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!AGENTS_POINTER_PATTERN.test(content)) {
    issues.push({
      check: 'claude-pointer',
      message: 'CLAUDE.md must point to AGENTS.md (Claude Code project instructions)',
      file: 'CLAUDE.md',
      severity: 'error',
    });
  }
  if (
    SINGLE_SOURCE_OF_TRUTH_PATTERN.test(content) === false &&
    !THIN_POINTER_PATTERN.test(content)
  ) {
    issues.push({
      check: 'claude-pointer',
      message: 'CLAUDE.md should state it is a thin pointer to AGENTS.md',
      file: 'CLAUDE.md',
      severity: 'error',
    });
  }
  return issues;
};

const validateCursorRule = (
  file: string,
  content: string | undefined,
  options: { required: boolean; expectAlwaysApply: boolean },
): AgentRuntimeComplianceIssue[] => {
  if (content === undefined) {
    if (options.required) {
      return [{ check: 'cursor-rule', message: `Missing ${file}`, file, severity: 'error' }];
    }
    return [];
  }
  if (!file.endsWith('.mdc')) {
    return [
      {
        check: 'cursor-rule',
        message: 'Cursor project rules must use .mdc extension',
        file,
        severity: 'error',
      },
    ];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  const frontmatter = parseMdcFrontmatter(content);
  if (!MDC_FRONTMATTER.test(content)) {
    issues.push({
      check: 'cursor-rule',
      message: 'Cursor rule missing YAML frontmatter (---)',
      file,
      severity: 'error',
    });
  }
  if (options.expectAlwaysApply && frontmatter.alwaysApply !== 'true') {
    issues.push({
      check: 'cursor-rule',
      message: 'vybekiit.mdc must set alwaysApply: true (Cursor always-apply rule)',
      file,
      severity: 'error',
    });
  }
  if (!AGENTS_POINTER_PATTERN.test(content)) {
    issues.push({
      check: 'cursor-rule',
      message: 'Cursor rule must point readers to AGENTS.md',
      file,
      severity: 'error',
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'cursor-rule',
      message: 'Cursor rule exceeds 500 lines — split per Cursor best practices',
      file,
      severity: 'error',
    });
  }
  return issues;
};

const validateAgentsSsot = (content: string | undefined): AgentRuntimeComplianceIssue[] => {
  if (content === undefined) {
    return [
      { check: 'agents-ssot', message: 'Missing AGENTS.md', file: 'AGENTS.md', severity: 'error' },
    ];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!(SINGLE_SOURCE_OF_TRUTH_PATTERN.test(content) || SSOT_PATTERN.test(content))) {
    issues.push({
      check: 'agents-ssot',
      message:
        'AGENTS.md should declare itself as single source of truth for all agents (Codex reads it natively)',
      file: 'AGENTS.md',
      severity: 'error',
    });
  }
  return issues;
};

const validateBuyerSkill = (path: string, content: string): AgentRuntimeComplianceIssue[] => {
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!content.startsWith('# Skill:')) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill must start with "# Skill: <name>"',
      file: path,
      severity: 'error',
    });
  }
  if (!BUYER_SKILL_GOAL_PATTERN.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill missing **Goal:**',
      file: path,
      severity: 'error',
    });
  }
  if (!BUYER_SKILL_CONTRACT_PATTERN.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill missing **Contract:**',
      file: path,
      severity: 'error',
    });
  }
  if (!BUYER_SKILL_STEPS_HEADERS.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message:
        'Buyer skill missing procedural section (## Steps, ## How to run, or ## When to run)',
      file: path,
      severity: 'error',
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill exceeds 500 lines — split per agent best practices',
      file: path,
      severity: 'error',
    });
  }
  return issues;
};

const validatePlatformWrapper = (path: string, content: string): AgentRuntimeComplianceIssue[] => {
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!content.trimStart().startsWith('#')) {
    issues.push({
      check: 'platform-skill-wrapper',
      message: 'Platform skill wrapper must start with a markdown heading',
      file: path,
      severity: 'error',
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'platform-skill-wrapper',
      message: 'Platform skill wrapper exceeds 500 lines',
      file: path,
      severity: 'error',
    });
  }
  return issues;
};

const validatePointerFile = (
  check: AgentRuntimeComplianceCheckId,
  file: string,
  content: string | undefined,
): AgentRuntimeComplianceIssue[] => {
  if (content === undefined) {
    return [
      {
        check,
        message: `Optional: ${file} not found — add it to support this runtime`,
        file,
        severity: 'warn',
      },
    ];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!AGENTS_POINTER_PATTERN.test(content)) {
    issues.push({
      check,
      message: `${file} must reference AGENTS.md (the SSOT)`,
      file,
      severity: 'error',
    });
  }
  return issues;
};

const validatePointerFiles = (
  files: Readonly<Record<string, string>>,
): AgentRuntimeComplianceIssue[] =>
  POINTER_FILE_REQUIREMENTS.flatMap(({ check, file }) =>
    validatePointerFile(check, file, files[file]),
  );

const validateBuyerSkills = (
  skillContents: Readonly<Record<string, string>>,
): AgentRuntimeComplianceIssue[] =>
  Object.entries(skillContents).flatMap(([path, content]) => validateBuyerSkill(path, content));

const validatePlatformWrappers = (
  platformSkillContents: Readonly<Record<string, string>>,
): AgentRuntimeComplianceIssue[] =>
  Object.entries(platformSkillContents).flatMap(([path, content]) =>
    validatePlatformWrapper(path, content),
  );

/**
 * Validate VybeKiit-authored agent runtime wiring + skills against official-runtime rules.
 *
 * @param input - input input.
 * @returns The plan agent runtime compliance result.
 * @example
 * const result = planAgentRuntimeCompliance(input);
 */
export const planAgentRuntimeCompliance = (
  input: AgentRuntimeComplianceInput,
): AgentRuntimeComplianceReport => {
  const issues: AgentRuntimeComplianceIssue[] = [
    ...validateLiveDocs(input.liveDocs),
    ...validateClaudePointer(input.files['CLAUDE.md']),
    ...validateCursorRule('.cursor/rules/vybekiit.mdc', input.files['.cursor/rules/vybekiit.mdc'], {
      required: true,
      expectAlwaysApply: true,
    }),
    ...validateCursorRule('.cursor/rules/patterns.mdc', input.files['.cursor/rules/patterns.mdc'], {
      required: false,
      expectAlwaysApply: false,
    }),
    ...validateAgentsSsot(input.files['AGENTS.md']),
    ...validatePointerFiles(input.files),
    ...validateBuyerSkills(input.skillContents),
    ...validatePlatformWrappers(input.platformSkillContents),
  ];

  return { issues, ok: issues.filter((i) => i.severity === 'error').length === 0 };
};
