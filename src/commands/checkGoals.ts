import process from 'node:process';
import { checkGoalDrift } from '@vybekiit/agent-kit';
import { listSkillPaths, resolveTemplateArg } from '../lib/agentLayerIo';

/**
 * Validate that a template's goal index and skill files still agree.
 *
 * @param args - CLI arguments after `check-goals`; first item may be a template name.
 * @param cwd - Project directory used for template detection and skill discovery.
 * @returns JSON output plus the process exit code for the command.
 * @example
 * const result = await runCheckGoals(['web'], process.cwd());
 */
export const runCheckGoals = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> => {
  const [templateArg] = args;
  const template = await resolveTemplateArg(templateArg, cwd);

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
};
