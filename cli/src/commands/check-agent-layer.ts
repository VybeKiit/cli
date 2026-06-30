import process from 'node:process';
import { planAgentLayerCompliance } from '@vybekiit/agent-kit';
import { loadAgentLayerSnapshot } from '../lib/agent-layer-snapshot';
import { resolveTemplateArg } from '../lib/agent-layer-io';

function parseLiveDocsEnv(): Record<string, string> | undefined {
  const raw = process.env.VYBEKIIT_AGENT_RUNTIME_DOCS;
  if (!raw?.trim()) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, string>)
    : undefined;
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

  const snapshot = await loadAgentLayerSnapshot(cwd);
  const liveDocs = parseLiveDocsEnv();
  const report = planAgentLayerCompliance({
    template,
    files: snapshot.files,
    skillPaths: snapshot.skillPaths,
    skillContents: snapshot.skillContents,
    buyerSkillStubContents: snapshot.buyerSkillStubContents,
    agentSkillSymlinkStates: snapshot.agentSkillSymlinkStates,
    platformSkillContents: snapshot.platformSkillContents,
    ...(snapshot.platformSkillsManifest === undefined
      ? {}
      : { platformSkillsManifest: snapshot.platformSkillsManifest }),
    ...(liveDocs === undefined ? {} : { liveDocs }),
  });

  return {
    json: JSON.stringify(
      {
        template: report.template,
        ok: report.ok,
        issues: report.issues,
        skillCount: snapshot.skillPaths.length,
      },
      null,
      2,
    ),
    exitCode: report.ok ? 0 : 1,
  };
}
