/**
 * Paths safe to overwrite from the VybeKiit template mirror during update-kit.
 * Never includes `src/`, `.env`, or buyer customizations (ADR-0007).
 */
export const AGENT_LAYER_PATHS: readonly string[] = [
  '.vybekiit',
  'AGENTS.md',
  'CLAUDE.md',
  'language.md',
  'checklist.md',
  '.cursor/rules/vybekiit.mdc',
  '.cursor/rules/patterns.mdc',
  '.github/copilot-instructions.md',
  '.kiro/steering/vybekiit.md',
  '.windsurf/rules/vybekiit.md',
  '.clinerules/vybekiit.md',
  '.amazonq/rules/vybekiit.md',
  '.continue/rules/vybekiit.md',
  '.junie/AGENTS.md',
  '.gemini/styleguide.md',
  'CONVENTIONS.md',
  '.augment/rules/vybekiit.md',
  '.augment-guidelines',
  '.roo/rules/vybekiit.md',
  'GEMINI.md',
  '.trae/rules/vybekiit.md',
  '.agent/rules/vybekiit.md',
  'replit.md',
  'platform-skills.manifest.json',
  'skills-lock.json',
  '.agents/skills',
];

/** Buyer-owned extension skills — never overwritten by sync-agent-layer. */
export const AGENT_LAYER_EXTENSION_PREFIX = '.vybekiit/extensions/';

/**
 * True when a path under the project root is buyer-owned extension content.
 *
 * @param relativePath - relative path input.
 * @returns Whether is agent layer extension path succeeds.
 * @example
 * const result = isAgentLayerExtensionPath(relativePath);
 */
export const isAgentLayerExtensionPath = (relativePath: string): boolean => {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized === '.vybekiit/extensions' || normalized.startsWith(AGENT_LAYER_EXTENSION_PREFIX)
  );
};

/** Result of planning an agent-layer sync from mirror → buyer project. */
export type AgentLayerSyncPlan = {
  /** Allowlisted paths that exist in the mirror and would be copied. */
  readonly pathsToSync: readonly string[];
  /** True when there is nothing to sync (mirror matches or empty). */
  readonly upToDate: boolean;
};

/**
 * Given which allowlisted paths exist in the mirror snapshot, plan what would
 *
 * @param mirrorPaths - mirror paths input.
 * @returns The plan agent layer sync result.
 * @example
 * const result = planAgentLayerSync(mirrorPaths);
 */
export const planAgentLayerSync = (mirrorPaths: readonly string[]): AgentLayerSyncPlan => {
  const pathsToSync = AGENT_LAYER_PATHS.filter((path) => mirrorPaths.includes(path));
  return {
    pathsToSync,
    upToDate: pathsToSync.length === 0,
  };
};

/**
 * Plain-language summary for the agent to relay (never jargon).
 *
 * @param plan - plan input.
 * @returns The rendered format agent layer sync summary text.
 * @example
 * const result = formatAgentLayerSyncSummary(plan);
 */
export const formatAgentLayerSyncSummary = (plan: AgentLayerSyncPlan): string => {
  if (plan.upToDate) {
    return 'Your assistant instructions are already up to date.';
  }
  const count = plan.pathsToSync.length;
  return `Refreshing ${count} instruction file${count === 1 ? '' : 's'} for your assistant.`;
};
