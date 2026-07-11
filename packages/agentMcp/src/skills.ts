import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  GOAL_ENTRIES,
  type GoalCatalogEntry,
  MCP_TOOLS_PLATFORM_SKILL_STEM,
  type TemplateId,
  USE_KIT_MCP_PHRASES,
  USE_KIT_MCP_SKILL_STEM,
} from '@vybekiit/agent-kit';
import { type PageResult, paginate, scoreQuery } from './uiCatalog';

/** Slim skill row returned by search (context-friendly). */
export type SlimSkill = {
  readonly id: string;
  readonly skillFile: string;
  readonly phrases: readonly string[];
  readonly path: string;
  readonly score: number;
};

/** Full skill detail including goal line and optional body excerpt. */
export type SkillDetail = {
  readonly id: string;
  readonly skillFile: string;
  readonly phrases: readonly string[];
  readonly path: string;
  readonly goal?: string;
  readonly excerpt?: string;
  readonly exists: boolean;
};

/** Skill path kind under the project root. */
export type SkillPathKind = 'buyer' | 'platform' | 'agents';

const BUYER_GOAL_PATTERN = /\*\*Goal:\*\*\s*(.+?)(?:\n|$)/;

/** Agent-indexed catalog skills that are not buyer goal rows. */
const AGENT_INDEXED_SKILLS = [
  {
    id: USE_KIT_MCP_SKILL_STEM,
    skillFile: USE_KIT_MCP_SKILL_STEM,
    phrases: USE_KIT_MCP_PHRASES,
    kind: 'agents' as const,
  },
  {
    id: MCP_TOOLS_PLATFORM_SKILL_STEM,
    skillFile: MCP_TOOLS_PLATFORM_SKILL_STEM,
    phrases: USE_KIT_MCP_PHRASES,
    kind: 'platform' as const,
  },
] as const;

/**
 * Resolve which skill file name a goal maps to for a template.
 *
 * @param entry - Goal catalog entry.
 * @param template - Active template id.
 * @returns Skill file stem, or null when the goal is N/A on that template.
 * @example
 * skillFileFor(entry, 'web') // 'setup-payments'
 */
const skillFileFor = (entry: GoalCatalogEntry, template: TemplateId): string | null =>
  entry.skills[template];

/**
 * Build the relative path agents should open for a skill.
 *
 * @param skillFile - Skill stem (e.g. `setup-payments`).
 * @param kind - Buyer skill, platform wrapper, or auto-discovered Agent Skill.
 * @returns Path under the project root.
 * @example
 * skillRelativePath('setup-payments', 'buyer') // '.vybekiit/skills/setup-payments.md'
 */
export const skillRelativePath = (skillFile: string, kind: SkillPathKind = 'buyer'): string => {
  if (kind === 'platform') {
    return `.vybekiit/platform-skills/${skillFile}.md`;
  }
  if (kind === 'agents') {
    return `.agents/skills/${skillFile}/SKILL.md`;
  }
  return `.vybekiit/skills/${skillFile}.md`;
};

/**
 * Candidate relative paths for loading a skill stem from disk.
 *
 * @param skillFile - Skill stem or goal id.
 * @returns Ordered paths to try.
 * @example
 * skillLoadCandidates('use-kit-mcp');
 */
export const skillLoadCandidates = (skillFile: string): readonly string[] => {
  const candidates = [
    skillRelativePath(skillFile, 'buyer'),
    skillRelativePath(skillFile, 'agents'),
    skillRelativePath(skillFile, 'platform'),
  ];
  if (!skillFile.endsWith('-vybekiit')) {
    candidates.push(skillRelativePath(`${skillFile}-vybekiit`, 'platform'));
  }
  if (skillFile === USE_KIT_MCP_SKILL_STEM) {
    return [
      skillRelativePath(USE_KIT_MCP_SKILL_STEM, 'agents'),
      skillRelativePath(MCP_TOOLS_PLATFORM_SKILL_STEM, 'platform'),
      ...candidates,
    ];
  }
  if (skillFile === MCP_TOOLS_PLATFORM_SKILL_STEM) {
    return [
      skillRelativePath(MCP_TOOLS_PLATFORM_SKILL_STEM, 'platform'),
      skillRelativePath(USE_KIT_MCP_SKILL_STEM, 'agents'),
      ...candidates,
    ];
  }
  return candidates;
};

/**
 * Fuzzy-search buyer goals/skills with cursor pagination.
 *
 * @param query - Free-text goal phrase or skill id (empty = list all).
 * @param options - Template filter, limit, and cursor.
 * @returns Page of slim skill rows for the active template.
 * @example
 * searchSkills('take money', { template: 'web', limit: 5 });
 */
export const searchSkills = (
  query: string,
  options?: {
    readonly template?: TemplateId;
    readonly limit?: number;
    readonly cursor?: string;
  },
): PageResult<SlimSkill> => {
  const template = options?.template ?? 'web';
  const trimmed = query.trim();

  const goalRows = GOAL_ENTRIES.flatMap((entry) => {
    const skillFile = skillFileFor(entry, template);
    if (skillFile === null) {
      return [];
    }
    const score =
      trimmed.length === 0 ? 1 : scoreQuery(trimmed, [entry.id, skillFile, ...entry.phrases]);
    if (score <= 0) {
      return [];
    }
    return [
      {
        id: entry.id,
        skillFile,
        phrases: entry.phrases,
        path: skillRelativePath(skillFile),
        score,
      } satisfies SlimSkill,
    ];
  });

  const agentRows = AGENT_INDEXED_SKILLS.flatMap((entry) => {
    const score =
      trimmed.length === 0 ? 1 : scoreQuery(trimmed, [entry.id, entry.skillFile, ...entry.phrases]);
    if (score <= 0) {
      return [];
    }
    return [
      {
        id: entry.id,
        skillFile: entry.skillFile,
        phrases: [...entry.phrases],
        path: skillRelativePath(entry.skillFile, entry.kind),
        score,
      } satisfies SlimSkill,
    ];
  });

  const ranked = [...goalRows, ...agentRows].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  );

  return paginate(ranked, {
    ...(options?.limit === undefined ? {} : { limit: options.limit }),
    ...(options?.cursor === undefined ? {} : { cursor: options.cursor }),
  });
};

/**
 * Load skill detail from disk when present; always returns catalog metadata.
 *
 * Tries buyer skill, Agent Skill SKILL.md, and platform wrapper paths.
 *
 * @param projectRoot - Buyer or monorepo project root.
 * @param skillIdOrFile - Goal id or skill file stem.
 * @param options - Template + whether to include a short body excerpt.
 * @returns Skill detail with existence flag.
 * @example
 * await getSkill(process.cwd(), 'setup-payments', { template: 'web' });
 */
export const getSkill = async (
  projectRoot: string,
  skillIdOrFile: string,
  options?: { readonly template?: TemplateId; readonly excerptLines?: number },
): Promise<SkillDetail> => {
  const template = options?.template ?? 'web';
  const excerptLines = options?.excerptLines ?? 40;

  const agentEntry = AGENT_INDEXED_SKILLS.find(
    (entry) => entry.id === skillIdOrFile || entry.skillFile === skillIdOrFile,
  );

  const entry =
    GOAL_ENTRIES.find((goal) => goal.id === skillIdOrFile) ??
    GOAL_ENTRIES.find((goal) => skillFileFor(goal, template) === skillIdOrFile);

  const skillFile =
    agentEntry?.skillFile ?? (entry ? skillFileFor(entry, template) : skillIdOrFile);
  if (skillFile === null || skillFile === undefined) {
    return {
      id: skillIdOrFile,
      skillFile: skillIdOrFile,
      phrases: [],
      path: skillRelativePath(skillIdOrFile),
      exists: false,
    };
  }

  const phrases = agentEntry ? [...agentEntry.phrases] : (entry?.phrases ?? []);
  const candidates = skillLoadCandidates(skillFile);

  for (const path of candidates) {
    const absolute = join(projectRoot, path);
    try {
      const content = await readFile(absolute, 'utf8');
      const goalMatch = content.match(BUYER_GOAL_PATTERN);
      const lines = content.split('\n').slice(0, excerptLines);
      return {
        id: agentEntry?.id ?? entry?.id ?? skillFile,
        skillFile,
        phrases,
        path,
        ...(goalMatch?.[1] === undefined ? {} : { goal: goalMatch[1].trim() }),
        excerpt: lines.join('\n'),
        exists: true,
      };
    } catch {
      // try next candidate path
    }
  }

  return {
    id: agentEntry?.id ?? entry?.id ?? skillFile,
    skillFile,
    phrases,
    path: candidates[0] ?? skillRelativePath(skillFile),
    exists: false,
  };
};

/**
 * List platform skill filenames under `.vybekiit/platform-skills` (paginated).
 *
 * @param projectRoot - Project root to scan.
 * @param options - Query filter, limit, cursor.
 * @returns Page of platform skill stems.
 * @example
 * await listPlatformSkills(cwd, { query: 'stripe' });
 */
export const listPlatformSkills = async (
  projectRoot: string,
  options?: { readonly query?: string; readonly limit?: number; readonly cursor?: string },
): Promise<
  PageResult<{ readonly name: string; readonly path: string; readonly score: number }>
> => {
  const dir = join(projectRoot, '.vybekiit', 'platform-skills');
  let names: string[] = [];
  try {
    const entries = await readdir(dir);
    names = entries
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .map((name) => name.replace(/\.md$/, ''));
  } catch {
    names = [];
  }

  const trimmed = options?.query?.trim() ?? '';
  const ranked = names
    .map((name) => {
      const score = trimmed.length === 0 ? 1 : scoreQuery(trimmed, [name]);
      return {
        name,
        path: skillRelativePath(name, 'platform'),
        score,
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return paginate(ranked, {
    ...(options?.limit === undefined ? {} : { limit: options.limit }),
    ...(options?.cursor === undefined ? {} : { cursor: options.cursor }),
  });
};
