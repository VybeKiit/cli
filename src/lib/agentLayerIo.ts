import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AGENT_LAYER_RENDER_FILES, buyerSkillStubPath, type TemplateId } from '@vybekiit/agent-kit';
import { detectTemplateName } from './detectTemplate';
import { isTemplateName } from './scaffold';

export const COMPLIANCE_FILES = [
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

export { AGENT_LAYER_RENDER_FILES };

export async function readOptionalFile(cwd: string, file: string): Promise<string | undefined> {
  const path = join(cwd, file);
  if (!(await pathExists(path))) {
    return;
  }
  let content: string | undefined;
  try {
    content = await readFile(path, 'utf8');
  } catch {
    content = undefined;
  }
  return content;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function resolveTemplateArg(
  explicit: string | undefined,
  cwd: string,
): Promise<TemplateId | null> {
  if (explicit === 'backend') {
    return 'backend';
  }
  if (explicit && isTemplateName(explicit)) {
    return explicit;
  }
  return await detectTemplateName(cwd);
}

export async function listSkillPaths(cwd: string): Promise<string[]> {
  const skillsDir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(skillsDir);
    return files.filter((f) => f.endsWith('.md')).map((f) => `.vybekiit/skills/${f}`);
  } catch {
    return [];
  }
}

export async function listBuyerSkillContents(cwd: string): Promise<Record<string, string>> {
  const skillPaths = await listSkillPaths(cwd);
  return readFilesByPath(cwd, skillPaths);
}

export async function readFilesByPath(
  cwd: string,
  paths: readonly string[],
): Promise<Record<string, string>> {
  const contents: Record<string, string> = {};
  for (const path of paths) {
    const body = await readOptionalFile(cwd, path);
    if (body !== undefined) {
      contents[path] = body;
    }
  }
  return contents;
}

/** Load markdown files the render pipeline regenerates. */
export async function loadAgentLayerRenderInputs(
  cwd: string,
): Promise<{ readonly contents: Record<string, string>; readonly present: string[] }> {
  const contents: Record<string, string> = {};
  const present: string[] = [];
  for (const file of AGENT_LAYER_RENDER_FILES) {
    const body = await readOptionalFile(cwd, file);
    if (body !== undefined) {
      contents[file] = body;
      present.push(file);
    }
  }
  return { contents, present };
}

/** Load render inputs when only paths known to exist should be read (sync post-copy). */
export async function loadExistingAgentLayerRenderInputs(
  cwd: string,
  pathExistsFn: (path: string) => Promise<boolean> = pathExists,
): Promise<Record<string, string>> {
  const fileContents: Record<string, string> = {};
  for (const file of AGENT_LAYER_RENDER_FILES) {
    const dest = join(cwd, file);
    if (await pathExistsFn(dest)) {
      try {
        fileContents[file] = await readFile(dest, 'utf8');
      } catch {
        // pathExists can be true before copy completes in tests — skip unreadable files
      }
    }
  }
  return fileContents;
}

export async function readBuyerSkillStubContents(
  cwd: string,
  skillPaths: readonly string[],
): Promise<Record<string, string>> {
  const stubPaths = skillPaths.map((buyerPath) => {
    const stem = buyerPath.replace(/^\.vybekiit\/skills\//, '').replace(/\.md$/, '');
    return buyerSkillStubPath(stem);
  });
  return readFilesByPath(cwd, stubPaths);
}

export async function listPlatformSkillWrappers(cwd: string): Promise<Record<string, string>> {
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

/** Write changed agent-layer markdown files after applyAgentLayerSections. */
export async function writeAgentLayerRenderOutputs(
  cwd: string,
  before: Readonly<Record<string, string>>,
  after: Readonly<Record<string, string>>,
  present: readonly string[],
): Promise<string[]> {
  const filesUpdated: string[] = [];

  for (const file of present) {
    const next = after[file];
    if (next !== undefined && next !== before[file]) {
      await writeFile(join(cwd, file), next);
      filesUpdated.push(file);
    }
  }

  const seedFiles = [
    'checklist.md',
    '.vybekiit/agent/tech-references.md',
    '.vybekiit/agent/session-bootstrap.md',
  ] as const;

  for (const file of seedFiles) {
    const next = after[file];
    if (next && !present.includes(file)) {
      await writeFile(join(cwd, file), next);
      filesUpdated.push(file);
    }
  }

  return filesUpdated;
}
