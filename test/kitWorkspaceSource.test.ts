import { mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  KIT_MIRROR_REPO,
  type KitWorkspaceSeams,
  kitMirrorCloneArgs,
  locateKitWorkspace,
} from '../src/lib/kitWorkspaceSource';
import { ScaffoldError } from '../src/lib/scaffold';

/** Build a no-op clone that counts calls. */
const countingClone = (): { readonly deps: KitWorkspaceSeams; readonly calls: () => number } => {
  let cloneCalls = 0;
  return {
    deps: {
      clone: () => {
        cloneCalls += 1;
        return Promise.resolve();
      },
      exists: () => Promise.resolve(false),
    },
    calls: () => cloneCalls,
  };
};

describe('locateKitWorkspace env overrides', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses VYBEKIIT_KIT_DIR when set, without cloning or cleanup', async () => {
    vi.stubEnv('VYBEKIIT_KIT_DIR', '/tmp/override-kit');
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    const { deps, calls } = countingClone();
    const resolved = await locateKitWorkspace(deps);
    expect(resolved.kitRoot).toBe('/tmp/override-kit');
    expect(resolved.cleanup).toBeUndefined();
    expect(calls()).toBe(0);
  });

  it('uses parent of VYBEKIIT_TEMPLATES_DIR when kit dir is unset', async () => {
    vi.stubEnv('VYBEKIIT_KIT_DIR', '');
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '/tmp/dev-kit/templates');
    const { deps, calls } = countingClone();
    const resolved = await locateKitWorkspace(deps);
    expect(resolved.kitRoot).toBe('/tmp/dev-kit');
    expect(resolved.cleanup).toBeUndefined();
    expect(calls()).toBe(0);
  });
});

describe('locateKitWorkspace monorepo-local', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the monorepo-local kit root when packages/ and templates/ exist on disk', async () => {
    vi.stubEnv('VYBEKIIT_KIT_DIR', '');
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    let cloneCalls = 0;
    const deps: KitWorkspaceSeams = {
      clone: () => {
        cloneCalls += 1;
        return Promise.resolve();
      },
      // Real disk probe: skip cli/ (packages/messaging only) for monorepo root with templates/.
      exists: async (path) => {
        try {
          await stat(path);
          return true;
        } catch {
          return false;
        }
      },
    };

    const resolved = await locateKitWorkspace(deps);
    await expect(stat(join(resolved.kitRoot, 'packages'))).resolves.toBeDefined();
    await expect(stat(join(resolved.kitRoot, 'templates'))).resolves.toBeDefined();
    expect(resolved.cleanup).toBeUndefined();
    expect(cloneCalls).toBe(0);
  });
});

describe('locateKitWorkspace kit mirror clone', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('clones the kit mirror into a temp dir when published, exposing a cleanup', async () => {
    vi.stubEnv('VYBEKIIT_KIT_DIR', '');
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    const cloned: Array<{ repoName: string; targetDir: string }> = [];
    const deps: KitWorkspaceSeams = {
      clone: async (repoName, targetDir) => {
        cloned.push({ repoName, targetDir });
        // Real `gh repo clone` creates targetDir; the mock must too so cleanup can remove it.
        await mkdir(targetDir, { recursive: true });
      },
      exists: () => Promise.resolve(false),
    };

    const resolved = await locateKitWorkspace(deps);

    expect(cloned).toHaveLength(1);
    expect(cloned[0]?.repoName).toBe(KIT_MIRROR_REPO);
    expect(cloned[0]?.targetDir).toBe(resolved.kitRoot);
    expect(resolved.kitRoot.startsWith(tmpdir())).toBe(true);
    expect(resolved.cleanup).toBeTypeOf('function');

    await expect(stat(resolved.kitRoot)).resolves.toBeDefined();
    await resolved.cleanup?.();
    await expect(stat(resolved.kitRoot)).rejects.toThrow();
  });

  it('propagates the clone failure as a ScaffoldError, leaving no temp dir behind', async () => {
    vi.stubEnv('VYBEKIIT_KIT_DIR', '');
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    const deps: KitWorkspaceSeams = {
      clone: () => Promise.reject(new ScaffoldError("Couldn't download the kit workspace. ...")),
      exists: () => Promise.resolve(false),
    };

    await expect(locateKitWorkspace(deps)).rejects.toBeInstanceOf(ScaffoldError);
  });
});

describe('kitMirrorCloneArgs', () => {
  it('uses authenticated HTTPS so a buyer SSH configuration cannot block setup', () => {
    expect(kitMirrorCloneArgs('kit', '/tmp/kit')).toEqual([
      'repo',
      'clone',
      'https://github.com/VybeKiit/kit',
      '/tmp/kit',
      '--',
      '--depth',
      '1',
      '--no-tags',
    ]);
  });
});
