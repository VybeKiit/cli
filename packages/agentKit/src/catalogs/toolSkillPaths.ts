/**
 * Tool-aware paths for machine-global extension skills.
 * Project-local extensions use `.vybekiit/extensions/` instead.
 */

export type AgentToolId = 'cursor' | 'claude' | 'codex' | 'generic';

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
  if (projectFiles['AGENTS.md']) return 'codex';
  return 'generic';
}
