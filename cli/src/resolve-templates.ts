import { execFile } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ScaffoldError, type TemplateName } from './scaffold';

const execFileAsync = promisify(execFile);

const HERE = dirname(fileURLToPath(import.meta.url));

/** GitHub org that holds the private per-template mirror repos (ADR-0005). */
const MIRROR_ORG = 'VybeKiit';

/**
 * The seams a {@link resolveTemplatesSource} call needs, injected so the published
 * clone path is unit-testable without `gh` or a network (ADR-0005). Defaults wire the
 * real `gh`-backed clone and a filesystem existence check.
 *
 * @property clone - downloads a template mirror into a target dir (see {@link cloneMirror})
 * @property exists - true when a path is present on disk (the monorepo-local probe)
 */
export interface ResolveDeps {
  readonly clone: (template: TemplateName, targetDir: string) => Promise<void>;
  readonly exists: (path: string) => Promise<boolean>;
}

/** A resolved template source directory plus an optional teardown for any temp clone. */
export interface ResolvedSource {
  /** Directory whose `<template>/` subdir holds the template files (what `scaffold` joins onto). */
  readonly source: string;
  /** Removes any temp clone created for a published install; absent for in-place sources. */
  readonly cleanup?: () => Promise<void>;
}

/** True when a path exists on disk — the default monorepo-local probe for {@link ResolveDeps}. */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a private template mirror (`VybeKiit/<template>`) into `targetDir` via `gh`.
 *
 * The published CLI ships no template files (the gate keeps the proprietary templates
 * off public npm — ADR-0005), so a real install clones the matching mirror using the
 * buyer's `gh` device-flow token. The clone is shallow and tag-free; it lands at the
 * mirror's ROOT, so callers pass `<temp>/<template>` to keep `scaffold`'s
 * `join(source, template)` shape intact. A failure is almost always "not signed in",
 * so it's rethrown as a {@link ScaffoldError} naming the one fix — never raw stderr.
 *
 * @param template - which template mirror to clone
 * @param targetDir - directory `gh` clones into (must not already exist)
 */
export async function cloneMirror(template: TemplateName, targetDir: string): Promise<void> {
  try {
    await execFileAsync('gh', [
      'repo',
      'clone',
      `${MIRROR_ORG}/${template}`,
      targetDir,
      '--',
      '--depth',
      '1',
      '--no-tags',
    ]);
  } catch {
    throw new ScaffoldError(
      `Couldn't download the ${template} template. Make sure your assistant is signed in to GitHub — run: gh auth login --web`,
    );
  }
}

/**
 * Locate the template source for one template, in ADR-0005 order:
 *
 * 1. `VYBEKIIT_TEMPLATES_DIR` set → that dir (dev/CI override), no cleanup.
 * 2. Else the monorepo-local `templates/` dir if it actually holds the template → it,
 *    no cleanup (the contributor's working copy).
 * 3. Else (a published install with no bundled templates) → clone the matching private
 *    mirror into a temp dir and return that, with a `cleanup` that removes it.
 *
 * Deps are injected so all three branches — including the clone and its failure — are
 * testable without touching the network.
 *
 * @param template - the template being scaffolded
 * @param deps - injectable clone + existence seams (defaults use real `gh` + `fs`)
 */
export async function resolveTemplatesSource(
  template: TemplateName,
  deps: ResolveDeps = { clone: cloneMirror, exists: pathExists },
): Promise<ResolvedSource> {
  const override = process.env.VYBEKIIT_TEMPLATES_DIR;
  if (override) {
    return { source: override };
  }

  const localRoot = resolve(HERE, '..', '..', 'templates');
  if (await deps.exists(join(localRoot, template))) {
    return { source: localRoot };
  }

  const tempRoot = await mkdtemp(join(tmpdir(), 'vybekiit-'));
  try {
    await deps.clone(template, join(tempRoot, template));
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
  return { source: tempRoot, cleanup: () => rm(tempRoot, { recursive: true, force: true }) };
}
