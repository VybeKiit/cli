/**
 * Paths safe to overwrite from the VybeKiit template mirror during update-kit.
 * Never includes `src/`, `.env`, or buyer customizations (ADR-0007).
 */
export const AGENT_LAYER_PATHS: readonly string[] = [
  '.vybekiit',
  'AGENTS.md',
  'CLAUDE.md',
  'BUILDER-VOICE.md',
  'language.md',
  'checklist.md',
  '.cursor/rules/vybekiit.mdc',
  '.cursor/rules/patterns.mdc',
  'platform-skills.manifest.json',
  'skills-lock.json',
  '.agents/skills',
];

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
