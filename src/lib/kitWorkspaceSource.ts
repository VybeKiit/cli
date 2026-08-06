import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { pathExists } from './pathExists';
import { ScaffoldError } from './scaffold';

const execFileAsync = promisify(execFile);

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * GitHub org that holds private delivery mirrors (same org as per-template mirrors in
 * `templateSource.ts`).
 */
const MIRROR_ORG = 'VybeKiit';

/**
 * Gated **kit workspace** delivery repo under the VybeKiit org (ADR-0038 Track 2).
 *
 * Synced by `scripts/dev/mirror/syncKitMirror.mjs` (packages + templates). Per-template
 * mirrors (`web` / `mobile` / `extension`) remain for advanced `drop` / single-surface
 * flows. `create app` clones this kit repo when not developing inside the monorepo.
 *
 * Gate invite defaults must include this name (`GITHUB_GATE_REPOS` / `VYBEKIIT_GATE_REPOS`).
 * If the delivery repo name changes, update this constant only — do not invent alternate orgs.
 */
export const KIT_MIRROR_REPO = 'kit';

/**
 * The seams a {@link locateKitWorkspace} call needs, injected so the published clone path is
 * unit-testable without `gh` or a network.
 *
 * @property clone - downloads the kit mirror into a target dir (see {@link cloneKitMirror})
 * @property exists - true when a path is present on disk (the monorepo-local probe)
 */
export type KitWorkspaceSeams = {
  readonly clone: (repoName: string, targetDir: string) => Promise<void>;
  readonly exists: (path: string) => Promise<boolean>;
};

/** A resolved kit workspace root plus optional teardown for a temp clone. */
export type LocatedKitWorkspace = {
  /** Root that contains `packages/` and `templates/`. */
  readonly kitRoot: string;
  /** Removes any temp clone created for a published install; absent for in-place sources. */
  readonly cleanup?: () => Promise<void>;
};

/**
 * Download the private kit workspace mirror (`VybeKiit/kit`) into `targetDir` via `gh`.
 *
 * Same buyer error style as per-template `cloneMirror`: one plain fix for sign-in, never raw
 * stderr. The clone is shallow and tag-free so the buyer does not inherit delivery history.
 *
 * @param repoName - Repo name under the mirror org (normally {@link KIT_MIRROR_REPO}).
 * @param targetDir - Directory `gh` clones into, which must not already exist.
 * @returns Promise that resolves after the kit is cloned.
 */
export const cloneKitMirror = async (repoName: string, targetDir: string): Promise<void> => {
  try {
    await execFileAsync('gh', [
      'repo',
      'clone',
      `${MIRROR_ORG}/${repoName}`,
      targetDir,
      '--',
      '--depth',
      '1',
      '--no-tags',
    ]);
  } catch (error) {
    throw new ScaffoldError(
      "Couldn't download the kit workspace. Make sure your assistant is signed in to GitHub: run gh auth login --web",
      { cause: error },
    );
  }
};

/**
 * Probe candidate monorepo roots (bundled `cli/dist` vs source `cli/src/lib`).
 *
 * @param exists - Path existence seam.
 * @returns First root that has both `packages/` and `templates/`, or null.
 */
const localKitWorkspaceRoot = async (
  exists: (path: string) => Promise<boolean>,
): Promise<string | null> => {
  // Bundled bin lives at cli/dist → monorepo root is ../..
  // Source modules live at cli/src/lib → monorepo root is ../../..
  const candidates = [resolve(HERE, '..', '..'), resolve(HERE, '..', '..', '..')];
  const probes = await Promise.all(
    candidates.map(async (root) => {
      const [hasPackages, hasTemplates] = await Promise.all([
        exists(join(root, 'packages')),
        exists(join(root, 'templates')),
      ]);
      return { root, ok: hasPackages && hasTemplates };
    }),
  );
  const hit = probes.find((probe) => probe.ok);
  return hit?.root ?? null;
};

/**
 * Locate the kit workspace root for `create app`, in ADR-0038 §8 order:
 *
 * 1. `VYBEKIIT_KIT_DIR` set: that dir (explicit kit override for dev/CI), no cleanup.
 * 2. Else `VYBEKIIT_TEMPLATES_DIR` set: its parent (legacy override points at `templates/`), no cleanup.
 * 3. Else the monorepo root when it holds `packages/` + `templates/`, no cleanup.
 * 4. Else (published install): clone {@link KIT_MIRROR_REPO} into a temp dir, with cleanup.
 *
 * Deps are injected so all branches, including clone failure, are testable without the network.
 *
 * @param deps - Injectable clone and existence seams.
 * @returns Resolved kit root plus cleanup when a temp clone was created.
 * @example
 * const { kitRoot, cleanup } = await locateKitWorkspace();
 */
export const locateKitWorkspace = async (
  deps: KitWorkspaceSeams = { clone: cloneKitMirror, exists: pathExists },
): Promise<LocatedKitWorkspace> => {
  const kitOverride = process.env.VYBEKIIT_KIT_DIR;
  if (kitOverride !== undefined && kitOverride !== '') {
    return { kitRoot: kitOverride };
  }

  const templatesOverride = process.env.VYBEKIIT_TEMPLATES_DIR;
  if (templatesOverride !== undefined && templatesOverride !== '') {
    return { kitRoot: resolve(templatesOverride, '..') };
  }

  const localRoot = await localKitWorkspaceRoot(deps.exists);
  if (localRoot !== null) {
    return { kitRoot: localRoot };
  }

  // Parent owns cleanup; clone target must not exist yet (`gh` rejects a pre-created dir).
  const tempParent = await mkdtemp(join(tmpdir(), 'vybekiit-kit-'));
  const kitRoot = join(tempParent, KIT_MIRROR_REPO);
  try {
    await deps.clone(KIT_MIRROR_REPO, kitRoot);
  } catch (error) {
    await rm(tempParent, { recursive: true, force: true });
    throw error;
  }

  return {
    kitRoot,
    cleanup: () => rm(tempParent, { recursive: true, force: true }),
  };
};
