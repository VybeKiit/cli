import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { checkGoalDrift, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';
import { isTemplateName } from '../lib/scaffold';

async function listSkillPaths(cwd: string): Promise<string[]> {
  const skillsDir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(skillsDir);
    return files.filter((f) => f.endsWith('.md')).map((f) => `.vybekiit/skills/${f}`);
  } catch {
    return [];
  }
}

export async function runCheckGoals(
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly json: string; readonly exitCode: number }> {
  const explicit = args[0];
  let template: TemplateId | null = null;

  if (explicit === 'backend') {
    template = 'backend';
  } else if (explicit && isTemplateName(explicit)) {
    template = explicit;
  } else {
    const detected = await detectTemplateName(cwd);
    template = detected;
  }

  if (!template) {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Could not detect template. Pass web, mobile, extension, or backend.',
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
