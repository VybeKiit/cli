import process from 'node:process';
import { planAgentLayerCompliance, type PlatformSkillsTemplateManifest } from '@vybekiit/agent-kit';
import { readAgentSkillSymlinkStates } from '../lib/agent-skill-symlinks';
import {
  COMPLIANCE_FILES,
  listPlatformSkillWrappers,
  listSkillPaths,
  readBuyerSkillStubContents,
  readFilesByPath,
  readOptionalFile,
  resolveTemplateArg,
} from '../lib/agent-layer-io';

function parseLiveDocsEnv(): Record<string, string> | undefined {
  const raw = process.env.VYBEKIIT_AGENT_RUNTIME_DOCS;
  if (!raw?.trim()) {
    return;
  }
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return undefined;
  }
}

export async function runCheckAgentLayer(
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const template = await resolveTemplateArg(args[0], cwd);

  if (!template) {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Could not detect template. Pass web, mobile, extension, spa, or backend.',
      }),
      exitCode: 1,
    };
  }

  const files = await readFilesByPath(cwd, COMPLIANCE_FILES);
  const skillPaths = await listSkillPaths(cwd);
  const skillContents = await readFilesByPath(cwd, skillPaths);
  const buyerSkillStubContents = await readBuyerSkillStubContents(cwd, skillPaths);
  const agentSkillSymlinkStates = await readAgentSkillSymlinkStates(cwd);
  const platformSkillContents = await listPlatformSkillWrappers(cwd);
  const liveDocs = parseLiveDocsEnv();
  const manifestRaw = await readOptionalFile(cwd, 'platform-skills.manifest.json');
  const platformSkillsManifest = manifestRaw
    ? (JSON.parse(manifestRaw) as PlatformSkillsTemplateManifest)
    : undefined;
  const report = planAgentLayerCompliance({
    template,
    files,
    skillPaths,
    skillContents,
    buyerSkillStubContents,
    agentSkillSymlinkStates,
    platformSkillContents,
    ...(platformSkillsManifest === undefined ? {} : { platformSkillsManifest }),
    ...(liveDocs === undefined ? {} : { liveDocs }),
  });

  return {
    json: JSON.stringify(
      {
        template: report.template,
        ok: report.ok,
        issues: report.issues,
        skillCount: skillPaths.length,
      },
      null,
      2,
    ),
    exitCode: report.ok ? 0 : 1,
  };
}
