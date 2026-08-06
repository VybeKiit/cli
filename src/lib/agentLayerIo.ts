import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AGENT_LAYER_RENDER_FILES as AGENT_LAYER_RENDER_FILE_PATHS,
  buyerSkillStubPath,
  type TemplateId,
} from '@vybekiit/agent-kit';
import { detectTemplateName } from './detectTemplate';
import { isTemplateName } from './scaffold';

/** Agent-layer files that must exist or be rendered for buyer-facing guidance. */
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

/**
 * Read a file when it exists, returning undefined for missing or unreadable files.
 *
 * @param cwd - Project directory that owns the file.
 * @param file - Relative file path to read.
 * @returns File contents, or undefined when the file cannot be read.
 * @example
 * const agents = await readOptionalFile(process.cwd(), 'AGENTS.md');
 */
export const readOptionalFile = async (cwd: string, file: string): Promise<string | undefined> => {
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
};

/**
 * Check whether a path exists on disk.
 *
 * @param path - Absolute path to probe.
 * @returns True when the path is accessible.
 * @example
 * const exists = await pathExists('/tmp/project/AGENTS.md');
 */
export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Resolve a template argument or infer the template from the current project.
 *
 * @param explicit - Optional template name passed on the command line.
 * @param cwd - Project directory used for layout inference.
 * @returns Template id, or null when no template can be inferred.
 * @example
 * const template = await selectedTemplate('web', process.cwd());
 */
export const selectedTemplate = async (
  explicit: string | undefined,
  cwd: string,
): Promise<TemplateId | null> => {
  if (explicit === 'backend') {
    return 'backend';
  }
  if (explicit !== undefined && explicit !== '' && isTemplateName(explicit)) {
    return explicit;
  }
  return await detectTemplateName(cwd);
};

/**
 * List buyer skill markdown paths relative to the project root.
 *
 * @param cwd - Project directory containing `.vybekiit/skills`.
 * @returns Relative markdown paths for buyer skills.
 * @example
 * const paths = await listSkillPaths(process.cwd());
 */
export const listSkillPaths = async (cwd: string): Promise<string[]> => {
  const skillsDir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(skillsDir);
    return files.filter((f) => f.endsWith('.md')).map((f) => `.vybekiit/skills/${f}`);
  } catch {
    return [];
  }
};

/**
 * Read every buyer skill markdown file in a project.
 *
 * @param cwd - Project directory containing `.vybekiit/skills`.
 * @returns Map of relative skill path to file contents.
 * @example
 * const skills = await listBuyerSkillContents(process.cwd());
 */
export const listBuyerSkillContents = async (cwd: string): Promise<Record<string, string>> => {
  const skillPaths = await listSkillPaths(cwd);
  return readFilesByPath(cwd, skillPaths);
};

/**
 * Read several relative files into a path-keyed object.
 *
 * @param cwd - Project directory containing the files.
 * @param paths - Relative paths to read.
 * @returns Map of paths that were readable to their contents.
 * @example
 * const files = await readFilesByPath(process.cwd(), ['AGENTS.md']);
 */
export const readFilesByPath = async (
  cwd: string,
  paths: readonly string[],
): Promise<Record<string, string>> => {
  const contents: Record<string, string> = {};
  const entries = await Promise.all(
    paths.map(async (path) => {
      const body = await readOptionalFile(cwd, path);
      if (body === undefined) {
        return;
      }

      return [path, body] as const;
    }),
  );

  for (const entry of entries) {
    if (entry !== undefined) {
      const [path, body] = entry;
      contents[path] = body;
    }
  }

  return contents;
};

/**
 * Load markdown files the render pipeline regenerates.
 *
 * @param cwd - Project directory containing the agent layer.
 * @returns Existing render file contents plus the paths that were present.
 * @example
 * const inputs = await loadAgentLayerRenderInputs(process.cwd());
 */
export const loadAgentLayerRenderInputs = async (
  cwd: string,
): Promise<{ readonly contents: Record<string, string>; readonly present: string[] }> => {
  const contents: Record<string, string> = {};
  const present: string[] = [];

  const entries = await Promise.all(
    AGENT_LAYER_RENDER_FILE_PATHS.map(async (file) => {
      const body = await readOptionalFile(cwd, file);
      if (body === undefined) {
        return;
      }

      return [file, body] as const;
    }),
  );

  for (const entry of entries) {
    if (entry !== undefined) {
      const [file, body] = entry;
      contents[file] = body;
      present.push(file);
    }
  }

  return { contents, present };
};

/**
 * Load render inputs when only paths known to exist should be read.
 *
 * @param cwd - Project directory containing the agent layer.
 * @param pathExistsFn - Injectable existence check for tests.
 * @returns Map of existing render files to their contents.
 * @example
 * const inputs = await loadExistingAgentLayerRenderInputs(process.cwd());
 */
export const loadExistingAgentLayerRenderInputs = async (
  cwd: string,
  pathExistsFn: (path: string) => Promise<boolean> = pathExists,
): Promise<Record<string, string>> => {
  const fileContents: Record<string, string> = {};

  const entries = await Promise.all(
    AGENT_LAYER_RENDER_FILE_PATHS.map(async (file) => {
      const dest = join(cwd, file);
      if (!(await pathExistsFn(dest))) {
        return null;
      }

      try {
        return [file, await readFile(dest, 'utf8')] as const;
      } catch {
        return null;
      }
    }),
  );

  for (const entry of entries) {
    if (entry !== null) {
      const [file, body] = entry;
      fileContents[file] = body;
    }
  }

  return fileContents;
};

/**
 * Read generated buyer skill stub files for a set of buyer skill paths.
 *
 * @param cwd - Project directory containing `.vybekiit/agent/skills`.
 * @param skillPaths - Buyer skill paths under `.vybekiit/skills`.
 * @returns Map of generated stub paths to their contents.
 * @example
 * const stubs = await readBuyerSkillStubContents(process.cwd(), ['.vybekiit/skills/payments.md']);
 */
export const readBuyerSkillStubContents = (
  cwd: string,
  skillPaths: readonly string[],
): Promise<Record<string, string>> => {
  const stubPaths = skillPaths.map((buyerPath) => {
    const prefix = '.vybekiit/skills/';
    const suffix = '.md';
    const withoutPrefix = buyerPath.startsWith(prefix) ? buyerPath.slice(prefix.length) : buyerPath;
    const stem = withoutPrefix.endsWith(suffix)
      ? withoutPrefix.slice(0, -suffix.length)
      : withoutPrefix;
    return buyerSkillStubPath(stem);
  });
  return readFilesByPath(cwd, stubPaths);
};

/**
 * Read platform skill wrapper markdown files from the project.
 *
 * @param cwd - Project directory containing `.vybekiit/platform-skills`.
 * @returns Map of wrapper paths to file contents.
 * @example
 * const wrappers = await listPlatformSkillWrappers(process.cwd());
 */
export const listPlatformSkillWrappers = async (cwd: string): Promise<Record<string, string>> => {
  const dir = join(cwd, '.vybekiit/platform-skills');
  const contents: Record<string, string> = {};
  try {
    const files = await readdir(dir);
    const wrapperFiles = files.filter((file) => file.endsWith('-vybekiit.md'));
    const entries = await Promise.all(
      wrapperFiles.map(async (file) => {
        const path = `.vybekiit/platform-skills/${file}`;
        return [path, await readFile(join(cwd, path), 'utf8')] as const;
      }),
    );

    for (const [path, body] of entries) {
      contents[path] = body;
    }
  } catch {
    // no platform-skills dir
  }
  return contents;
};

/**
 * Write changed agent-layer markdown files after sections are rendered.
 *
 * @param cwd - Project directory containing the agent layer.
 * @param before - File contents before rendering.
 * @param after - File contents after rendering.
 * @param present - Render files that already existed before rendering.
 * @returns Relative paths written by this call.
 * @example
 * const updated = await writeAgentLayerRenderOutputs(cwd, before, after, present);
 */
export const writeAgentLayerRenderOutputs = async (
  cwd: string,
  before: Readonly<Record<string, string>>,
  after: Readonly<Record<string, string>>,
  present: readonly string[],
): Promise<string[]> => {
  const filesUpdated: string[] = [];
  const writes: Promise<void>[] = [];

  for (const file of present) {
    const next = after[file];
    if (next !== undefined && next !== before[file]) {
      writes.push(writeFile(join(cwd, file), next));
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
    if (next !== undefined && next !== '' && !present.includes(file)) {
      writes.push(writeFile(join(cwd, file), next));
      filesUpdated.push(file);
    }
  }

  await Promise.all(writes);

  return filesUpdated;
};
