import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { applyAgentLayerSections, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';

const RENDER_TARGET_FILES = [
  'AGENTS.md',
  'language.md',
  'BUILDER-VOICE.md',
  '.vybekiit/agent/ui-sources.md',
  '.vybekiit/agent/tech-references.md',
  '.vybekiit/agent/session-bootstrap.md',
  '.vybekiit/agent/goal-index.md',
  'checklist.md',
] as const;

/**
 * Regenerate marked agent-layer sections in-place for allowlisted markdown files.
 */
export async function runRenderAgentLayer(
  cwd: string = process.cwd(),
  templateArg?: string,
): Promise<{
  readonly filesUpdated: readonly string[];
  readonly exitCode: number;
}> {
  const template =
    (templateArg as TemplateId | undefined) ?? (await detectTemplateName(cwd)) ?? 'web';

  const contents: Record<string, string> = {};
  const present: string[] = [];

  for (const file of RENDER_TARGET_FILES) {
    const path = join(cwd, file);
    try {
      contents[file] = await readFile(path, 'utf8');
      present.push(file);
    } catch {
      // file not in this template — skip
    }
  }

  if (present.length === 0) {
    return { filesUpdated: [], exitCode: 1 };
  }

  const updated = applyAgentLayerSections(contents, { template });
  const filesUpdated: string[] = [];

  for (const file of present) {
    const next = updated[file];
    if (next !== undefined && next !== contents[file]) {
      await writeFile(join(cwd, file), next, 'utf8');
      filesUpdated.push(file);
    }
  }

  if (updated['checklist.md'] && !present.includes('checklist.md')) {
    await writeFile(join(cwd, 'checklist.md'), updated['checklist.md'], 'utf8');
    filesUpdated.push('checklist.md');
  }

  if (
    updated['.vybekiit/agent/tech-references.md'] &&
    !present.includes('.vybekiit/agent/tech-references.md')
  ) {
    await writeFile(
      join(cwd, '.vybekiit/agent/tech-references.md'),
      updated['.vybekiit/agent/tech-references.md'],
      'utf8',
    );
    filesUpdated.push('.vybekiit/agent/tech-references.md');
  }

  if (
    updated['.vybekiit/agent/session-bootstrap.md'] &&
    !present.includes('.vybekiit/agent/session-bootstrap.md')
  ) {
    await writeFile(
      join(cwd, '.vybekiit/agent/session-bootstrap.md'),
      updated['.vybekiit/agent/session-bootstrap.md'],
      'utf8',
    );
    filesUpdated.push('.vybekiit/agent/session-bootstrap.md');
  }

  return { filesUpdated, exitCode: 0 };
}
