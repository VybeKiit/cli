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
import { detectTemplateName } from '../lib/detectTemplate';
import { cloneMirror, resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, ScaffoldError, type TemplateName } from '../lib/scaffold';

export { detectTemplateName } from '../lib/detectTemplate';

const execFileAsync = promisify(execFile);

/** Injectable seams for unit tests (no network / no gh). */
export interface SyncAgentLayerDeps {
  readonly resolve: typeof resolveTemplatesSource;
  readonly copy: typeof cp;
  readonly runSkillsUpdate: (cwd: string) => Promise<void>;
  readonly pathExists: (path: string) => Promise<boolean>;
}

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

async function listMirrorAgentPaths(
  mirrorRoot: string,
  pathExists: SyncAgentLayerDeps['pathExists'],
): Promise<string[]> {
  const found: string[] = [];
  for (const path of AGENT_LAYER_PATHS) {
    if (await pathExists(join(mirrorRoot, path))) {
      found.push(path);
    }
  }
  return found;
}

/** Copy allowlisted path from mirror → buyer, skipping buyer-owned extension subtrees. */
async function copyAgentLayerPath(
  mirrorRoot: string,
  cwd: string,
  path: string,
  copy: SyncAgentLayerDeps['copy'],
  pathExists: SyncAgentLayerDeps['pathExists'],
): Promise<void> {
  const src = join(mirrorRoot, path);
  const dest = join(cwd, path);

  if (path !== '.vybekiit') {
    await copy(src, dest, { recursive: true, force: true });
    return;
  }

  // Selective .vybekiit sync — never overwrite `.vybekiit/extensions/**`
  const { readdir, stat, mkdir } = await import('node:fs/promises');

  async function walk(rel: string): Promise<void> {
    const relNorm = rel.replace(/\\/g, '/');
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
      for (const entry of entries) {
        await walk(join(relNorm, entry));
      }
      return;
    }
    await copy(srcPath, destPath, { force: true });
  }

  await walk('.vybekiit');
}

export interface SyncAgentLayerResult {
  readonly lines: readonly string[];
  readonly exitCode: number;
}

/**
 * Sync the VybeKiit agent layer from the template mirror into the buyer's project.
 * Copies only {@link AGENT_LAYER_PATHS}; runs `npx skills update` when a lock file exists.
 */
export async function runSyncAgentLayer(
  args: string[],
  cwd: string = process.cwd(),
  deps: SyncAgentLayerDeps = defaultDeps,
): Promise<SyncAgentLayerResult> {
  const explicit = args[0];
  const template: TemplateName | null =
    explicit && isTemplateName(explicit) ? explicit : await detectTemplateName(cwd);

  if (!template) {
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
    cleanup = resolved.cleanup;
    const mirrorRoot = join(resolved.source, template);
    const mirrorPaths = await listMirrorAgentPaths(mirrorRoot, deps.pathExists);
    const plan = planAgentLayerSync(mirrorPaths);

    const lines: string[] = [formatAgentLayerSyncSummary(plan)];

    const goalIndexBefore =
      plan.pathsToSync.includes('.vybekiit') &&
      (await deps.pathExists(join(cwd, '.vybekiit/agent/goal-index.md')))
        ? await readFile(join(cwd, '.vybekiit/agent/goal-index.md'), 'utf8')
        : undefined;

    for (const path of plan.pathsToSync) {
      await copyAgentLayerPath(mirrorRoot, cwd, path, deps.copy, deps.pathExists);
    }

    if (goalIndexBefore !== undefined) {
      const goalIndexPath = join(cwd, '.vybekiit/agent/goal-index.md');
      const synced = await readFile(goalIndexPath, 'utf8');
      const merged = mergeGoalIndexOnSync(synced, goalIndexBefore);
      if (merged !== synced) {
        await writeFile(goalIndexPath, merged, 'utf8');
      }
    }

    const fileContents = await loadExistingAgentLayerRenderInputs(cwd, deps.pathExists);
    if (Object.keys(fileContents).length > 0) {
      const rendered = applyAgentLayerSections(fileContents, { template });
      for (const [file, content] of Object.entries(rendered)) {
        if (fileContents[file] !== undefined && content !== fileContents[file]) {
          await writeFile(join(cwd, file), content, 'utf8');
        }
      }
      lines.push('Refreshed generated instruction sections.');
    }

    if (await deps.pathExists(join(cwd, 'skills-lock.json'))) {
      try {
        await deps.runSkillsUpdate(cwd);
        lines.push('Updated your assistant’s platform instruction files.');
      } catch {
        lines.push('Could not refresh platform instruction files — try again later.');
      }
    }

    lines.push('Done — your assistant has the latest instructions.');
    return { lines, exitCode: 0 };
  } catch (error) {
    if (error instanceof ScaffoldError) {
      return { lines: [error.message], exitCode: 1 };
    }
    throw error;
  } finally {
    await cleanup?.();
  }
}
