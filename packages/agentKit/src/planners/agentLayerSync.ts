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

/** True when a path under the project root is buyer-owned extension content. */
export function isAgentLayerExtensionPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized === '.vybekiit/extensions' || normalized.startsWith(AGENT_LAYER_EXTENSION_PREFIX)
  );
}

/** Result of planning an agent-layer sync from mirror → buyer project. */
export interface AgentLayerSyncPlan {
  /** Allowlisted paths that exist in the mirror and would be copied. */
  readonly pathsToSync: readonly string[];
  /** True when there is nothing to sync (mirror matches or empty). */
  readonly upToDate: boolean;
}

/**
 * Given which allowlisted paths exist in the mirror snapshot, plan what would
 * be copied into the buyer's project. Pure — filesystem reads happen in the CLI.
 *
 * @param mirrorPaths - allowlisted paths that exist under the cloned mirror root
 */
export function planAgentLayerSync(mirrorPaths: readonly string[]): AgentLayerSyncPlan {
  const pathsToSync = AGENT_LAYER_PATHS.filter((path) => mirrorPaths.includes(path));
  return {
    pathsToSync,
    upToDate: pathsToSync.length === 0,
  };
}

/** Plain-language summary for the agent to relay (never jargon). */
export function formatAgentLayerSyncSummary(plan: AgentLayerSyncPlan): string {
  if (plan.upToDate) {
    return 'Your assistant instructions are already up to date.';
  }
  const count = plan.pathsToSync.length;
  return `Refreshing ${count} instruction file${count === 1 ? '' : 's'} for your assistant.`;
}
