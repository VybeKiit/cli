import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScaffoldError } from '../src/lib/scaffold';
import { locateTemplateSource, type TemplateSourceSeams } from '../src/lib/templateSource';

/**
 * `locateTemplateSource` resolution-order tests. All three branches are exercised
 * with injected `clone`/`exists` seams so nothing touches `gh` or the network.
 * `vi.stubEnv` controls (and restores) `VYBEKIIT_TEMPLATES_DIR` so cases stay isolated
 * without mutating `process.env` directly.
 */
describe('locateTemplateSource overrides', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses VYBEKIIT_TEMPLATES_DIR when set, without cloning or cleanup', async () => {
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '/tmp/override-templates');
    let cloneCalls = 0;
    const deps: TemplateSourceSeams = {
      clone: () => {
        cloneCalls += 1;
        return Promise.resolve();
      },
      exists: () => Promise.resolve(false),
    };

    const resolved = await locateTemplateSource('web', deps);

    expect(resolved.source).toBe('/tmp/override-templates');
    expect(resolved.cleanup).toBeUndefined();
    expect(cloneCalls).toBe(0);
  });

  it('uses the monorepo-local templates dir when it holds the template, no cleanup', async () => {
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    let cloneCalls = 0;
    const deps: TemplateSourceSeams = {
      clone: () => {
        cloneCalls += 1;
        return Promise.resolve();
      },
      exists: () => Promise.resolve(true),
    };

    const resolved = await locateTemplateSource('web', deps);

    expect(resolved.source.endsWith('templates')).toBe(true);
    expect(resolved.cleanup).toBeUndefined();
    expect(cloneCalls).toBe(0);
  });
});

describe('locateTemplateSource mirror clone', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('clones the mirror into a temp dir when published, exposing a cleanup', async () => {
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    const cloned: Array<{ template: string; targetDir: string }> = [];
    const deps: TemplateSourceSeams = {
      clone: (template, targetDir) => {
        cloned.push({ template, targetDir });
        return Promise.resolve();
      },
      exists: () => Promise.resolve(false),
    };

    const resolved = await locateTemplateSource('web', deps);

    expect(cloned).toHaveLength(1);
    expect(cloned[0]?.template).toBe('web');
    expect(cloned[0]?.targetDir).toBe(join(resolved.source, 'web'));
    expect(resolved.source.startsWith(tmpdir())).toBe(true);
    expect(resolved.cleanup).toBeTypeOf('function');

    // The temp root really exists and cleanup removes it.
    await expect(stat(resolved.source)).resolves.toBeDefined();
    await resolved.cleanup?.();
    await expect(stat(resolved.source)).rejects.toThrow();
  });

  it('propagates the clone failure as a ScaffoldError, leaving no temp dir behind', async () => {
    vi.stubEnv('VYBEKIIT_TEMPLATES_DIR', '');
    const deps: TemplateSourceSeams = {
      clone: () => Promise.reject(new ScaffoldError('Couldn’t download the web template. ...')),
      exists: () => Promise.resolve(false),
    };

    await expect(locateTemplateSource('web', deps)).rejects.toBeInstanceOf(ScaffoldError);
  });
});
