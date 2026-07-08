/**
 * Tool-aware paths for machine-global extension skills.
 * Project-local extensions use `.vybekiit/extensions/` instead.
 */

export type AgentToolId =
  | 'cursor'
  | 'claude'
  | 'codex'
  | 'copilot'
  | 'kiro'
  | 'windsurf'
  | 'cline'
  | 'amazonq'
  | 'continue'
  | 'junie'
  | 'gemini'
  | 'aider'
  | 'augment'
  | 'roo'
  | 'gemini-cli'
  | 'trae'
  | 'antigravity'
  | 'replit'
  | 'devin'
  | 'opencode'
  | 'zed'
  | 'generic';

export type ToolSkillPathEntry = {
  readonly id: AgentToolId;
  readonly label: string;
  /** Home-relative path template; `<name>` is the skill stem. */
  readonly globalSkillPath: string;
  /** skills.sh agent flag when pinning upstream skills globally. */
  readonly skillsShAgent?: string;
  /** Hint for detecting this tool in the buyer project. */
  readonly detectHint: string;
};

export const TOOL_SKILL_PATHS: readonly ToolSkillPathEntry[] = [
  {
    id: 'cursor',
    label: 'Cursor',
    globalSkillPath: '~/.cursor/skills-cursor/<name>/SKILL.md',
    skillsShAgent: 'cursor',
    detectHint: '.cursor/rules/vybekiit.mdc or .cursor/skills/',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    globalSkillPath: '~/.claude/skills/<name>/SKILL.md',
    skillsShAgent: 'claude-code',
    detectHint: 'CLAUDE.md session or .claude/skills/',
  },
  {
    id: 'codex',
    label: 'Codex',
    globalSkillPath: '~/.agents/skills/<name>/SKILL.md',
    skillsShAgent: 'codex',
    detectHint: 'AGENTS.md native Codex session',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    globalSkillPath: '~/.github/copilot-instructions.md',
    detectHint: '.github/copilot-instructions.md',
  },
  {
    id: 'kiro',
    label: 'Kiro',
    globalSkillPath: '~/.kiro/steering/<name>/SKILL.md',
    detectHint: '.kiro/steering/',
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    globalSkillPath: '~/.windsurf/rules/<name>.md',
    detectHint: '.windsurf/rules/',
  },
  {
    id: 'cline',
    label: 'Cline',
    globalSkillPath: '~/Documents/Cline/Rules/<name>.md',
    detectHint: '.clinerules/',
  },
  {
    id: 'amazonq',
    label: 'Amazon Q',
    globalSkillPath: '~/.amazonq/rules/<name>.md',
    detectHint: '.amazonq/rules/',
  },
  {
    id: 'continue',
    label: 'Continue',
    globalSkillPath: '~/.continue/rules/<name>.md',
    detectHint: '.continue/rules/',
  },
  {
    id: 'junie',
    label: 'Junie',
    globalSkillPath: '~/.junie/skills/<name>/SKILL.md',
    detectHint: '.junie/AGENTS.md',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    globalSkillPath: '~/.gemini/<name>.md',
    detectHint: '.gemini/styleguide.md',
  },
  {
    id: 'aider',
    label: 'Aider',
    globalSkillPath: '~/.aider/<name>.md',
    detectHint: 'CONVENTIONS.md',
  },
  {
    id: 'augment',
    label: 'Augment',
    globalSkillPath: '~/.augment/rules/<name>.md',
    detectHint: '.augment-guidelines',
  },
  {
    id: 'roo',
    label: 'Roo',
    globalSkillPath: '~/.roo/rules/<name>.md',
    detectHint: '.roo/rules/',
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    globalSkillPath: '~/.gemini-cli/<name>.md',
    detectHint: 'GEMINI.md',
  },
  {
    id: 'trae',
    label: 'Trae',
    globalSkillPath: '~/.trae/rules/<name>.md',
    detectHint: '.trae/rules/',
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    globalSkillPath: '~/.agent/rules/<name>.md',
    detectHint: '.agent/rules/',
  },
  {
    id: 'replit',
    label: 'Replit',
    globalSkillPath: '~/.replit/<name>.md',
    detectHint: 'replit.md',
  },
  {
    id: 'devin',
    label: 'Devin',
    globalSkillPath: '~/.devin/rules/<name>.md',
    detectHint: '.devin/',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    globalSkillPath: '~/.opencode/rules/<name>.md',
    detectHint: '.opencode/',
  },
  {
    id: 'zed',
    label: 'Zed',
    globalSkillPath: '~/.zed/rules/<name>.md',
    detectHint: '.zed/',
  },
  {
    id: 'generic',
    label: 'Agent Skills (fallback)',
    globalSkillPath: '~/.agents/skills/<name>/SKILL.md',
    detectHint: 'fallback when tool cannot be detected',
  },
] as const;

/** Project-local extension paths (buyer-owned; never overwritten by sync-agent-layer). */
export const EXTENSION_PATHS = {
  buyerSkill: '.vybekiit/extensions/skills/<goal>.md',
  platformWrapper: '.vybekiit/extensions/platform-skills/<tech>-vybekiit.md',
  goalIndexOverlay: '.vybekiit/extensions/goal-index.md',
  upstreamPin: '.agents/skills/<name>/',
} as const;

type AgentToolDetectionRule = {
  readonly path: string;
  readonly tool: Exclude<AgentToolId, 'generic'>;
};

const AGENT_TOOL_DETECTION_RULES: readonly AgentToolDetectionRule[] = [
  { path: '.cursor/rules/vybekiit.mdc', tool: 'cursor' },
  { path: 'CLAUDE.md', tool: 'claude' },
  { path: '.github/copilot-instructions.md', tool: 'copilot' },
  { path: '.kiro/steering/', tool: 'kiro' },
  { path: '.windsurf/rules/', tool: 'windsurf' },
  { path: '.clinerules/', tool: 'cline' },
  { path: '.amazonq/rules/', tool: 'amazonq' },
  { path: '.continue/rules/', tool: 'continue' },
  { path: '.junie/AGENTS.md', tool: 'junie' },
  { path: '.gemini/styleguide.md', tool: 'gemini' },
  { path: 'CONVENTIONS.md', tool: 'aider' },
  { path: '.augment-guidelines', tool: 'augment' },
  { path: '.roo/rules/', tool: 'roo' },
  { path: 'GEMINI.md', tool: 'gemini-cli' },
  { path: '.trae/rules/', tool: 'trae' },
  { path: '.agent/rules/', tool: 'antigravity' },
  { path: 'replit.md', tool: 'replit' },
  { path: '.devin/', tool: 'devin' },
  { path: '.opencode/', tool: 'opencode' },
  { path: '.zed/', tool: 'zed' },
  { path: 'AGENTS.md', tool: 'codex' },
];

const resolveToolSkillPathEntry = (tool: AgentToolId): ToolSkillPathEntry => {
  const entry = TOOL_SKILL_PATHS.find((candidate) => candidate.id === tool);
  if (entry === undefined) {
    throw new Error(`Missing global skill path entry for ${tool}`);
  }
  return entry;
};

/**
 * Resolve the machine-global skill path for a detected assistant.
 *
 * @param tool - tool input.
 * @param skillStem - skill stem input.
 * @returns The rendered resolve global skill path text.
 * @example
 * const result = resolveGlobalSkillPath(tool, skillStem);
 */
export const resolveGlobalSkillPath = (tool: AgentToolId, skillStem: string): string => {
  const entry = resolveToolSkillPathEntry(tool);
  return entry.globalSkillPath.replace('<name>', skillStem);
};

/**
 * Detect the active assistant from project-local marker files.
 *
 * @param projectFiles - project files input.
 * @returns The detect agent tool result.
 * @example
 * const result = detectAgentTool(projectFiles);
 */
export const detectAgentTool = (projectFiles: Readonly<Record<string, boolean>>): AgentToolId => {
  const match = AGENT_TOOL_DETECTION_RULES.find((rule) => projectFiles[rule.path] === true);
  if (match !== undefined) {
    return match.tool;
  }
  return 'generic';
};
