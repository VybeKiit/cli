import { execFile } from 'node:child_process';
import { access, cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import {
  AGENT_LAYER_PATHS,
  formatAgentLayerSyncSummary,
  planAgentLayerSync,
} from '@vybekiit/agent-kit';
import { cloneMirror, resolveTemplatesSource } from './resolve-templates';
import { ScaffoldError, type TemplateName, isTemplateName } from './scaffold';

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

/**
 * Infer template from the buyer project layout when no explicit name is passed.
 */
export async function detectTemplateName(cwd: string): Promise<TemplateName | null> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; main?: string };
    if (pkg.dependencies?.expo || pkg.main?.includes('expo-router')) return 'mobile';
    if (pkg.dependencies?.next) return 'web';
  } catch {
    // no package.json — fall through
  }
  try {
    await access(join(cwd, '.vybekiit/skills/publish-extension.md'));
    return 'extension';
  } catch {
    return 'web';
  }
}

async function listMirrorAgentPaths(
  mirrorRoot: string,
  pathExists: SyncAgentLayerDeps['pathExists'],
): Promise<string[]> {
  const found: string[] = [];
  for (const path of AGENT_LAYER_PATHS) {
    if (await pathExists(join(mirrorRoot, path))) found.push(path);
  }
  return found;
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
  const template = explicit && isTemplateName(explicit) ? explicit : await detectTemplateName(cwd);

  if (!template) {
    return {
      lines: ['Could not tell which template this project uses. Pass: web, mobile, or extension.'],
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

    for (const path of plan.pathsToSync) {
      const src = join(mirrorRoot, path);
      const dest = join(cwd, path);
      await deps.copy(src, dest, { recursive: true, force: true });
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
