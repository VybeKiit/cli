import { execFile } from 'node:child_process';
import { access, cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import {
  AGENT_LAYER_PATHS,
  applyAgentLayerSections,
  formatAgentLayerSyncSummary,
  isAgentLayerExtensionPath,
  mergeGoalIndexOnSync,
  planAgentLayerSync,
} from '@vybekiit/agent-kit';
import { loadExistingAgentLayerRenderInputs } from '../lib/agentLayerIo';
import { detectTemplateName as detectProjectTemplateName } from '../lib/detectTemplate';
import { cloneMirror, resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, ScaffoldError, type TemplateName } from '../lib/scaffold';

const execFileAsync = promisify(execFile);

type SkillsUpdateResult = 'missing-lock' | 'updated' | 'failed';

/** Injectable seams for unit tests (no network / no gh). */
export type SyncAgentLayerDeps = {
  readonly resolve: typeof resolveTemplatesSource;
  readonly copy: typeof cp;
  readonly runSkillsUpdate: (cwd: string) => Promise<void>;
  readonly pathExists: (path: string) => Promise<boolean>;
};

const defaultDeps: SyncAgentLayerDeps = {
  resolve: resolveTemplatesSource,
  copy: cp,
  runSkillsUpdate: async (cwd) => {
    await execFileAsync('npx', ['skills', 'update', '-y'], { cwd, env: process.env });
  },
  pathExists: async (path) => {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Infer a template name for sync-agent-layer callers.
 *
 * @param cwd - Buyer project directory to inspect.
 * @returns Detected template name, or null when package metadata is inconclusive.
 * @example
 * const template = await detectTemplateName(process.cwd());
 */
export const detectTemplateName = async (cwd: string): Promise<TemplateName | null> =>
  detectProjectTemplateName(cwd);

/**
 * Resolve the template argument without silently accepting unsupported names.
 *
 * @param explicit - Optional template argument from the CLI.
 * @param cwd - Buyer project directory used for auto-detection when no argument is provided.
 * @returns Template name to sync, or null when no valid template can be resolved.
 * @example
 * const template = await resolveSyncTemplate('web', process.cwd());
 */
const resolveSyncTemplate = async (
  explicit: string | undefined,
  cwd: string,
): Promise<TemplateName | null> => {
  if (explicit === undefined || explicit === '') {
    return await detectProjectTemplateName(cwd);
  }

  if (isTemplateName(explicit)) {
    return explicit;
  }

  return null;
};

/**
 * List agent-layer paths that exist in a template mirror.
 *
 * @param mirrorRoot - Root directory for the selected template mirror.
 * @param pathExists - Injectable path existence check.
 * @returns Existing agent-layer paths from the allowlist.
 * @example
 * const paths = await listMirrorAgentPaths(mirrorRoot, pathExists);
 */
const listMirrorAgentPaths = async (
  mirrorRoot: string,
  pathExists: SyncAgentLayerDeps['pathExists'],
): Promise<string[]> => {
  const entries = await Promise.all(
    AGENT_LAYER_PATHS.map(async (path) => {
      if (await pathExists(join(mirrorRoot, path))) {
        return path;
      }

      return null;
    }),
  );

  return entries.filter((path): path is string => path !== null);
};

type CopyAgentLayerPathOptions = {
  readonly mirrorRoot: string;
  readonly cwd: string;
  readonly path: string;
  readonly copy: SyncAgentLayerDeps['copy'];
  readonly pathExists: SyncAgentLayerDeps['pathExists'];
};

/**
 * Copy one allowlisted path from mirror to buyer, skipping buyer-owned extension subtrees.
 *
 * @param options - Copy roots, path, and filesystem seams.
 * @returns Promise that resolves after the path is copied.
 * @example
 * await copyAgentLayerPath({ mirrorRoot, cwd, path: 'AGENTS.md', copy, pathExists });
 */
const copyAgentLayerPath = async (options: CopyAgentLayerPathOptions): Promise<void> => {
  const { mirrorRoot, cwd, path, copy, pathExists } = options;
  const src = join(mirrorRoot, path);
  const dest = join(cwd, path);

  if (path !== '.vybekiit') {
    await copy(src, dest, { recursive: true, force: true });
    return;
  }

  const { readdir, stat, mkdir } = await import('node:fs/promises');

  /**
   * Recursively copy `.vybekiit` paths while preserving buyer-owned extension content.
   *
   * @param rel - Relative `.vybekiit` path to copy.
   * @returns Promise that resolves after the subtree is copied.
   * @example
   * await walk('.vybekiit');
   */
  const walk = async (rel: string): Promise<void> => {
    const relNorm = rel.split('\\').join('/');
    if (isAgentLayerExtensionPath(relNorm)) {
      return;
    }

    const srcPath = join(mirrorRoot, relNorm);
    const destPath = join(cwd, relNorm);
    if (!(await pathExists(srcPath))) {
      return;
    }
    const info = await stat(srcPath);
    if (info.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      const entries = await readdir(srcPath);
      await Promise.all(entries.map((entry) => walk(join(relNorm, entry))));
      return;
    }
    await copy(srcPath, destPath, { force: true });
  };

  await walk('.vybekiit');
};

/**
 * Copy all paths selected by the sync plan.
 *
 * @param pathsToSync - Planned allowlist paths to copy.
 * @param mirrorRoot - Root directory for the selected template mirror.
 * @param cwd - Buyer project directory.
 * @param deps - Injectable filesystem seams.
 * @returns Promise that resolves after all planned paths are copied.
 * @example
 * await copyPlannedAgentLayerPaths(plan.pathsToSync, mirrorRoot, cwd, deps);
 */
const copyPlannedAgentLayerPaths = async (
  pathsToSync: readonly string[],
  mirrorRoot: string,
  cwd: string,
  deps: SyncAgentLayerDeps,
): Promise<void> => {
  await Promise.all(
    pathsToSync.map((path) =>
      copyAgentLayerPath({
        mirrorRoot,
        cwd,
        path,
        copy: deps.copy,
        pathExists: deps.pathExists,
      }),
    ),
  );
};

/**
 * Read the buyer's goal index before syncing when the mirror includes `.vybekiit`.
 *
 * @param pathsToSync - Planned agent-layer paths to copy.
 * @param cwd - Buyer project directory.
 * @param deps - Injectable filesystem seams.
 * @returns Existing goal-index text, or undefined when no merge is needed.
 * @example
 * const previousGoalIndex = await readGoalIndexBeforeSync(paths, cwd, deps);
 */
const readGoalIndexBeforeSync = async (
  pathsToSync: readonly string[],
  cwd: string,
  deps: SyncAgentLayerDeps,
): Promise<string | undefined> => {
  if (!pathsToSync.includes('.vybekiit')) {
    return;
  }

  const goalIndexPath = join(cwd, '.vybekiit/agent/goal-index.md');
  if (!(await deps.pathExists(goalIndexPath))) {
    return;
  }

  return await readFile(goalIndexPath, 'utf8');
};

/**
 * Restore buyer progress entries after the template mirror copy refreshes `.vybekiit`.
 *
 * @param cwd - Buyer project directory.
 * @param goalIndexBefore - Goal index content captured before copying, when present.
 * @returns Promise that resolves after the merge write is complete.
 * @example
 * await mergeGoalIndexAfterSync(process.cwd(), previousGoalIndex);
 */
const mergeGoalIndexAfterSync = async (
  cwd: string,
  goalIndexBefore: string | undefined,
): Promise<void> => {
  if (goalIndexBefore === undefined) {
    return;
  }

  const goalIndexPath = join(cwd, '.vybekiit/agent/goal-index.md');
  const synced = await readFile(goalIndexPath, 'utf8');
  const merged = mergeGoalIndexOnSync(synced, goalIndexBefore);
  if (merged !== synced) {
    await writeFile(goalIndexPath, merged, 'utf8');
  }
};

/**
 * Re-render generated instruction blocks after copying fresh agent-layer files.
 *
 * @param cwd - Buyer project directory.
 * @param template - Template whose generated sections should be rendered.
 * @param deps - Injectable filesystem seams.
 * @returns True when render inputs existed and were evaluated.
 * @example
 * const refreshed = await refreshGeneratedInstructionSections(cwd, 'web', deps);
 */
const refreshGeneratedInstructionSections = async (
  cwd: string,
  template: TemplateName,
  deps: SyncAgentLayerDeps,
): Promise<boolean> => {
  const fileContents = await loadExistingAgentLayerRenderInputs(cwd, deps.pathExists);
  if (Object.keys(fileContents).length === 0) {
    return false;
  }

  const rendered = applyAgentLayerSections(fileContents, { template });
  const writes = Object.entries(rendered).map(async ([file, content]) => {
    if (fileContents[file] !== undefined && content !== fileContents[file]) {
      await writeFile(join(cwd, file), content, 'utf8');
    }
  });
  await Promise.all(writes);

  return true;
};

/**
 * Refresh platform skill lock outputs when the buyer project has a skills lock file.
 *
 * @param cwd - Buyer project directory.
 * @param deps - Injectable command and filesystem seams.
 * @returns Status describing whether the refresh ran, failed, or was skipped.
 * @example
 * const status = await refreshPlatformInstructionFiles(process.cwd(), deps);
 */
const refreshPlatformInstructionFiles = async (
  cwd: string,
  deps: SyncAgentLayerDeps,
): Promise<SkillsUpdateResult> => {
  if (!(await deps.pathExists(join(cwd, 'skills-lock.json')))) {
    return 'missing-lock';
  }

  try {
    await deps.runSkillsUpdate(cwd);
    return 'updated';
  } catch {
    return 'failed';
  }
};

export type SyncAgentLayerResult = {
  readonly lines: readonly string[];
  readonly exitCode: number;
};

/**
 * Sync the VybeKiit agent layer from the template mirror into the buyer's project.
 * Copies only {@link AGENT_LAYER_PATHS}; runs `npx skills update` when a lock file exists.
 *
 * @param args - CLI arguments after `sync-agent-layer`; first item may be a template.
 * @param cwd - Buyer project directory.
 * @param deps - Injectable seams for tests.
 * @returns Plain output lines plus the process exit code.
 * @example
 * const result = await runSyncAgentLayer(['web'], process.cwd());
 */
export const runSyncAgentLayer = async (
  args: string[],
  cwd: string = process.cwd(),
  deps: SyncAgentLayerDeps = defaultDeps,
): Promise<SyncAgentLayerResult> => {
  const [explicit] = args;
  const template = await resolveSyncTemplate(explicit, cwd);

  if (template === null) {
    return {
      lines: [
        'Could not tell which template this project uses. Pass: web, mobile, extension, backend, or spa.',
      ],
      exitCode: 1,
    };
  }

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await deps.resolve(template, {
      clone: cloneMirror,
      exists: deps.pathExists,
    });
    const { cleanup: resolvedCleanup, source } = resolved;
    cleanup = resolvedCleanup;
    const mirrorRoot = join(source, template);
    const mirrorPaths = await listMirrorAgentPaths(mirrorRoot, deps.pathExists);
    const plan = planAgentLayerSync(mirrorPaths);

    const lines: string[] = [formatAgentLayerSyncSummary(plan)];
    const goalIndexBefore = await readGoalIndexBeforeSync(plan.pathsToSync, cwd, deps);

    await copyPlannedAgentLayerPaths(plan.pathsToSync, mirrorRoot, cwd, deps);
    await mergeGoalIndexAfterSync(cwd, goalIndexBefore);

    if (await refreshGeneratedInstructionSections(cwd, template, deps)) {
      lines.push('Refreshed generated instruction sections.');
    }

    const skillsUpdate = await refreshPlatformInstructionFiles(cwd, deps);
    if (skillsUpdate === 'updated') {
      lines.push('Updated your assistant’s platform instruction files.');
    }
    if (skillsUpdate === 'failed') {
      lines.push('Could not refresh platform instruction files. Try again later.');
    }

    lines.push('Done. Your assistant has the latest instructions.');
    return { lines, exitCode: 0 };
  } catch (error) {
    if (error instanceof ScaffoldError) {
      return { lines: [error.message], exitCode: 1 };
    }
    throw error;
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};
