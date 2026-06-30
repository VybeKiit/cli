import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { planAgentLayerCompliance, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';
import { isTemplateName } from '../lib/scaffold';

const COMPLIANCE_FILES = [
  'AGENTS.md',
  'language.md',
  'CONTEXT.md',
  'checklist.md',
  '.vybekiit/agent/tech-references.md',
  '.vybekiit/agent/session-bootstrap.md',
  '.vybekiit/agent/goal-index.md',
] as const;

async function listSkillPaths(cwd: string): Promise<string[]> {
  const skillsDir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(skillsDir);
    return files.filter((f) => f.endsWith('.md')).map((f) => `.vybekiit/skills/${f}`);
  } catch {
    return [];
  }
}

export async function runCheckAgentLayer(
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
    template = await detectTemplateName(cwd);
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

  const files: Record<string, string> = {};
  for (const file of COMPLIANCE_FILES) {
    try {
      files[file] = await readFile(join(cwd, file), 'utf8');
    } catch {
      // missing — compliance report will flag
    }
  }

  const skillPaths = await listSkillPaths(cwd);
  const report = planAgentLayerCompliance({ template, files, skillPaths });

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
