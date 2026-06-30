import { execFile } from 'node:child_process';
import { access, cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import {
  AGENT_LAYER_PATHS,
  applyAgentLayerSections,
  formatAgentLayerSyncSummary,
  planAgentLayerSync,
} from '@vybekiit/agent-kit';
import { detectTemplateName } from '../lib/detect-template';
import { cloneMirror, resolveTemplatesSource } from '../lib/resolve-templates';
import { isTemplateName, ScaffoldError, type TemplateName } from '../lib/scaffold';

export { detectTemplateName } from '../lib/detect-template';

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
      lines: [
        'Could not tell which template this project uses. Pass: web, mobile, extension, or backend.',
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

    for (const path of plan.pathsToSync) {
      const src = join(mirrorRoot, path);
      const dest = join(cwd, path);
      await deps.copy(src, dest, { recursive: true, force: true });
    }

    const renderTargets = [
      'AGENTS.md',
      'language.md',
      'BUILDER-VOICE.md',
      '.vybekiit/agent/ui-sources.md',
      '.vybekiit/agent/tech-references.md',
      '.vybekiit/agent/session-bootstrap.md',
      '.vybekiit/agent/goal-index.md',
      'checklist.md',
    ];
    const fileContents: Record<string, string> = {};
    for (const file of renderTargets) {
      const dest = join(cwd, file);
      if (await deps.pathExists(dest)) {
        try {
          fileContents[file] = await readFile(dest, 'utf8');
        } catch {
          // pathExists can be true before copy completes in tests — skip unreadable files
        }
      }
    }
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
