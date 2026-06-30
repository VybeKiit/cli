import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { planAgentLayerCompliance, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';
import { isTemplateName } from '../lib/scaffold';

const COMPLIANCE_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'language.md',
  'CONTEXT.md',
  'checklist.md',
  '.cursor/rules/vybekiit.mdc',
  '.cursor/rules/patterns.mdc',
  '.vybekiit/agent/tech-references.md',
  '.vybekiit/agent/session-bootstrap.md',
  '.vybekiit/agent/goal-index.md',
] as const;

async function readOptionalFile(cwd: string, file: string): Promise<string | undefined> {
  try {
    return await readFile(join(cwd, file), 'utf8');
  } catch {
    return undefined;
  }
}

async function listPlatformSkillWrappers(cwd: string): Promise<Record<string, string>> {
  const dir = join(cwd, '.vybekiit/platform-skills');
  const contents: Record<string, string> = {};
  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (!file.endsWith('-vybekiit.md')) {
        continue;
      }
      const path = `.vybekiit/platform-skills/${file}`;
      contents[path] = await readFile(join(cwd, path), 'utf8');
    }
  } catch {
    // no platform-skills dir
  }
  return contents;
}

async function readSkillContents(
  cwd: string,
  skillPaths: readonly string[],
): Promise<Record<string, string>> {
  const contents: Record<string, string> = {};
  for (const path of skillPaths) {
    const body = await readOptionalFile(cwd, path);
    if (body !== undefined) {
      contents[path] = body;
    }
  }
  return contents;
}

function parseLiveDocsEnv(): Record<string, string> | undefined {
  const raw = process.env.VYBEKIIT_AGENT_RUNTIME_DOCS;
  if (!raw?.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return undefined;
  }
}

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
    const body = await readOptionalFile(cwd, file);
    if (body !== undefined) {
      files[file] = body;
    }
  }

  const skillPaths = await listSkillPaths(cwd);
  const skillContents = await readSkillContents(cwd, skillPaths);
  const platformSkillContents = await listPlatformSkillWrappers(cwd);
  const liveDocs = parseLiveDocsEnv();
  const report = planAgentLayerCompliance({
    template,
    files,
    skillPaths,
    skillContents,
    platformSkillContents,
    ...(liveDocs !== undefined ? { liveDocs } : {}),
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
