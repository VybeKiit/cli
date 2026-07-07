import type { PlatformSkillsTemplateManifest } from '@vybekiit/agent-kit';
import {
  COMPLIANCE_FILES,
  listPlatformSkillWrappers,
  listSkillPaths,
  readBuyerSkillStubContents,
  readFilesByPath,
  readOptionalFile,
} from './agentLayerIo';
import { readAgentSkillSymlinkStates } from './agentSkillSymlinks';

/** Everything check-agent-layer needs from disk: one loader, one test fixture tree. */
export type AgentLayerSnapshot = {
  readonly files: Record<string, string>;
  readonly skillPaths: string[];
  readonly skillContents: Record<string, string>;
  readonly buyerSkillStubContents: Record<string, string>;
  readonly agentSkillSymlinkStates: Awaited<ReturnType<typeof readAgentSkillSymlinkStates>>;
  readonly platformSkillContents: Record<string, string>;
  readonly platformSkillsManifest?: PlatformSkillsTemplateManifest;
};

/**
 * Load every file and skill artifact needed by the agent-layer checker.
 *
 * @param cwd - Project directory containing the buyer-facing agent layer.
 * @returns Snapshot of compliance files, skills, stubs, symlinks, and platform wrappers.
 * @example
 * const snapshot = await loadAgentLayerSnapshot(process.cwd());
 */
export const loadAgentLayerSnapshot = async (cwd: string): Promise<AgentLayerSnapshot> => {
  const skillPaths = await listSkillPaths(cwd);
  const manifestRaw = await readOptionalFile(cwd, 'platform-skills.manifest.json');
  const platformSkillsManifest =
    manifestRaw !== undefined && manifestRaw !== ''
      ? (JSON.parse(manifestRaw) as PlatformSkillsTemplateManifest)
      : undefined;

  return {
    files: await readFilesByPath(cwd, COMPLIANCE_FILES),
    skillPaths,
    skillContents: await readFilesByPath(cwd, skillPaths),
    buyerSkillStubContents: await readBuyerSkillStubContents(cwd, skillPaths),
    agentSkillSymlinkStates: await readAgentSkillSymlinkStates(cwd),
    platformSkillContents: await listPlatformSkillWrappers(cwd),
    ...(platformSkillsManifest === undefined ? {} : { platformSkillsManifest }),
  };
};
