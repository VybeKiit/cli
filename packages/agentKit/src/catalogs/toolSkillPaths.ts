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

export interface ToolSkillPathEntry {
  readonly id: AgentToolId;
  readonly label: string;
  /** Home-relative path template; `<name>` is the skill stem. */
  readonly globalSkillPath: string;
  /** skills.sh agent flag when pinning upstream skills globally. */
  readonly skillsShAgent?: string;
  /** Hint for detecting this tool in the buyer project. */
  readonly detectHint: string;
}

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

export function resolveGlobalSkillPath(tool: AgentToolId, skillStem: string): string {
  const entry = TOOL_SKILL_PATHS.find((e) => e.id === tool) ?? TOOL_SKILL_PATHS.at(-1)!;
  return entry.globalSkillPath.replace('<name>', skillStem);
}

export function detectAgentTool(projectFiles: Readonly<Record<string, boolean>>): AgentToolId {
  if (projectFiles['.cursor/rules/vybekiit.mdc']) return 'cursor';
  if (projectFiles['CLAUDE.md']) return 'claude';
  if (projectFiles['.github/copilot-instructions.md']) return 'copilot';
  if (projectFiles['.kiro/steering/']) return 'kiro';
  if (projectFiles['.windsurf/rules/']) return 'windsurf';
  if (projectFiles['.clinerules/']) return 'cline';
  if (projectFiles['.amazonq/rules/']) return 'amazonq';
  if (projectFiles['.continue/rules/']) return 'continue';
  if (projectFiles['.junie/AGENTS.md']) return 'junie';
  if (projectFiles['.gemini/styleguide.md']) return 'gemini';
  if (projectFiles['CONVENTIONS.md']) return 'aider';
  if (projectFiles['.augment-guidelines']) return 'augment';
  if (projectFiles['.roo/rules/']) return 'roo';
  if (projectFiles['GEMINI.md']) return 'gemini-cli';
  if (projectFiles['.trae/rules/']) return 'trae';
  if (projectFiles['.agent/rules/']) return 'antigravity';
  if (projectFiles['replit.md']) return 'replit';
  if (projectFiles['.devin/']) return 'devin';
  if (projectFiles['.opencode/']) return 'opencode';
  if (projectFiles['.zed/']) return 'zed';
  if (projectFiles['AGENTS.md']) return 'codex';
  return 'generic';
}
