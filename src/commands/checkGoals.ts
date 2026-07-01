import process from 'node:process';
import { checkGoalDrift } from '@vybekiit/agent-kit';
import { listSkillPaths, resolveTemplateArg } from '../lib/agentLayerIo';

export async function runCheckGoals(
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

  const skillPaths = await listSkillPaths(cwd);
  const report = checkGoalDrift(template, skillPaths);

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
