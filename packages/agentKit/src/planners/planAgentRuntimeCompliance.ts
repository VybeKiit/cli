import { AGENT_RUNTIME_DOC_SOURCES } from '@vybekiit/agentKit/catalogs/agentRuntimeDocSources';

export type AgentRuntimeComplianceCheckId =
  | 'runtime-docs-live'
  | 'claude-pointer'
  | 'cursor-rule'
  | 'agents-ssot'
  | 'buyer-skill-format'
  | 'platform-skill-wrapper';

export interface AgentRuntimeComplianceIssue {
  readonly check: AgentRuntimeComplianceCheckId;
  readonly message: string;
  readonly file?: string;
}

export interface AgentRuntimeComplianceInput {
  readonly files: Readonly<Record<string, string>>;
  readonly skillContents: Readonly<Record<string, string>>;
  readonly platformSkillContents: Readonly<Record<string, string>>;
  /** Live-fetched doc bodies keyed by {@link AGENT_RUNTIME_DOC_SOURCES} id. */
  readonly liveDocs?: Readonly<Record<string, string>>;
}

export interface AgentRuntimeComplianceReport {
  readonly issues: readonly AgentRuntimeComplianceIssue[];
  readonly ok: boolean;
}

const BUYER_SKILL_STEPS_HEADERS = /^## (Steps|How to run|When to run)/m;
const MDC_FRONTMATTER = /^---\n[\s\S]*?\n---/;

function parseMdcFrontmatter(content: string): Record<string, string> {
  const match = content.match(MDC_FRONTMATTER);
  if (!match) {
    return {};
  }
  const block = match[0];
  const fields: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      fields[kv[1] ?? ''] = kv[2]?.trim() ?? '';
    }
  }
  return fields;
}

function validateLiveDocs(
  liveDocs: Readonly<Record<string, string>> | undefined,
): AgentRuntimeComplianceIssue[] {
  if (liveDocs === undefined) {
    return [];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  for (const source of AGENT_RUNTIME_DOC_SOURCES) {
    const body = liveDocs?.[source.id];
    if (!body) {
      issues.push({
        check: 'runtime-docs-live',
        message: `Missing live doc body for ${source.id} (${source.url})`,
      });
      continue;
    }
    for (const phrase of source.mustInclude) {
      if (!body.includes(phrase)) {
        issues.push({
          check: 'runtime-docs-live',
          message: `Official doc drift: ${source.id} no longer mentions "${phrase}" — update agent-runtime rules`,
        });
      }
    }
  }
  return issues;
}

function validateClaudePointer(content: string | undefined): AgentRuntimeComplianceIssue[] {
  if (content === undefined) {
    return [{ check: 'claude-pointer', message: 'Missing CLAUDE.md', file: 'CLAUDE.md' }];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!/AGENTS\.md/i.test(content)) {
    issues.push({
      check: 'claude-pointer',
      message: 'CLAUDE.md must point to AGENTS.md (Claude Code project instructions)',
      file: 'CLAUDE.md',
    });
  }
  if (/single source of truth/i.test(content) === false && !/thin pointer/i.test(content)) {
    issues.push({
      check: 'claude-pointer',
      message: 'CLAUDE.md should state it is a thin pointer to AGENTS.md',
      file: 'CLAUDE.md',
    });
  }
  return issues;
}

function validateCursorRule(
  file: string,
  content: string | undefined,
  options: { required: boolean; expectAlwaysApply: boolean },
): AgentRuntimeComplianceIssue[] {
  if (content === undefined) {
    if (options.required) {
      return [{ check: 'cursor-rule', message: `Missing ${file}`, file }];
    }
    return [];
  }
  if (!file.endsWith('.mdc')) {
    return [
      {
        check: 'cursor-rule',
        message: 'Cursor project rules must use .mdc extension',
        file,
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
    });
  }
  if (options.expectAlwaysApply && frontmatter.alwaysApply !== 'true') {
    issues.push({
      check: 'cursor-rule',
      message: 'vybekiit.mdc must set alwaysApply: true (Cursor always-apply rule)',
      file,
    });
  }
  if (!/AGENTS\.md/i.test(content)) {
    issues.push({
      check: 'cursor-rule',
      message: 'Cursor rule must point readers to AGENTS.md',
      file,
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'cursor-rule',
      message: 'Cursor rule exceeds 500 lines — split per Cursor best practices',
      file,
    });
  }
  return issues;
}

function validateAgentsSsot(content: string | undefined): AgentRuntimeComplianceIssue[] {
  if (content === undefined) {
    return [{ check: 'agents-ssot', message: 'Missing AGENTS.md', file: 'AGENTS.md' }];
  }
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!(/single source of truth/i.test(content) || /SSOT/i.test(content))) {
    issues.push({
      check: 'agents-ssot',
      message:
        'AGENTS.md should declare itself as single source of truth for all agents (Codex reads it natively)',
      file: 'AGENTS.md',
    });
  }
  return issues;
}

function validateBuyerSkill(path: string, content: string): AgentRuntimeComplianceIssue[] {
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!content.startsWith('# Skill:')) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill must start with "# Skill: <name>"',
      file: path,
    });
  }
  if (!/\*\*Goal:\*\*/.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill missing **Goal:**',
      file: path,
    });
  }
  if (!/\*\*Contract:\*\*/.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill missing **Contract:**',
      file: path,
    });
  }
  if (!BUYER_SKILL_STEPS_HEADERS.test(content)) {
    issues.push({
      check: 'buyer-skill-format',
      message:
        'Buyer skill missing procedural section (## Steps, ## How to run, or ## When to run)',
      file: path,
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'buyer-skill-format',
      message: 'Buyer skill exceeds 500 lines — split per agent best practices',
      file: path,
    });
  }
  return issues;
}

function validatePlatformWrapper(path: string, content: string): AgentRuntimeComplianceIssue[] {
  const issues: AgentRuntimeComplianceIssue[] = [];
  if (!content.trimStart().startsWith('#')) {
    issues.push({
      check: 'platform-skill-wrapper',
      message: 'Platform skill wrapper must start with a markdown heading',
      file: path,
    });
  }
  if (content.split('\n').length > 500) {
    issues.push({
      check: 'platform-skill-wrapper',
      message: 'Platform skill wrapper exceeds 500 lines',
      file: path,
    });
  }
  return issues;
}

/** Validate VybeKiit-authored agent runtime wiring + skills against official-runtime rules. */
export function planAgentRuntimeCompliance(
  input: AgentRuntimeComplianceInput,
): AgentRuntimeComplianceReport {
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
  ];

  for (const [path, content] of Object.entries(input.skillContents)) {
    issues.push(...validateBuyerSkill(path, content));
  }
  for (const [path, content] of Object.entries(input.platformSkillContents)) {
    issues.push(...validatePlatformWrapper(path, content));
  }

  return { issues, ok: issues.length === 0 };
}
