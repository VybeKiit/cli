import process from 'node:process';
import { planAgentLayerCompliance } from '@vybekiit/agent-kit';
import { resolveTemplateArg } from '../lib/agentLayerIo';
import { loadAgentLayerSnapshot } from '../lib/agentLayerSnapshot';

/**
 * Parse live documentation URLs passed through the environment.
 *
 * @returns String record of runtime docs, or undefined when unset or invalid.
 * @example
 * const liveDocs = parseLiveDocsEnv();
 */
const parseLiveDocsEnv = (): Record<string, string> | undefined => {
  const raw = process.env.VYBEKIIT_AGENT_RUNTIME_DOCS;
  if (raw === undefined || raw.trim() === '') {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return;
  }

  const liveDocs: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      return;
    }
    liveDocs[key] = value;
  }

  return liveDocs;
};

/**
 * Check the buyer-facing agent layer for structural compliance.
 *
 * @param args - CLI arguments after `check-agent-layer`; first item may be a template.
 * @param cwd - Project directory containing the agent layer.
 * @returns JSON compliance report plus the process exit code.
 * @example
 * const result = await runCheckAgentLayer(['web'], process.cwd());
 */
export const runCheckAgentLayer = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const [templateArg] = args;
  const template = await resolveTemplateArg(templateArg, cwd);

  if (template === null) {
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
};
