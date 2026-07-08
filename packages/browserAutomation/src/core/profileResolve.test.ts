import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('resolveProfilePath', () => {
  let tempHome: string;

  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'automate-profile-'));
    vi.resetModules();
  });

  afterEach(async () => {
    await rm(tempHome, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  const loadProfileResolve = async () => {
    vi.doMock('node:os', async () => {
      const actual = await vi.importActual<typeof import('node:os')>('node:os');
      return { ...actual, homedir: () => tempHome };
    });
    return import('./profileResolve');
  };

  it('uses explicit --profile path', async () => {
    const { resolveProfilePath } = await loadProfileResolve();
    expect(await resolveProfilePath('namecheap', '/custom/nc-profile')).toBe('/custom/nc-profile');
  });

  it('uses --profile=last from manifest', async () => {
    await mkdir(join(tempHome, '.vybekiit'), { recursive: true });
    await writeFile(
      join(tempHome, '.vybekiit/automate-profiles.json'),
      `${JSON.stringify({
        namecheap: { path: '/last/nc', lastUsedAt: '2026-01-01T00:00:00.000Z' },
      })}\n`,
    );
    const { resolveProfilePath } = await loadProfileResolve();
    expect(await resolveProfilePath('namecheap', 'last')).toBe('/last/nc');
  });

  it('rememberProfilePath merges without removing other domains', async () => {
    const { rememberProfilePath } = await loadProfileResolve();
    await rememberProfilePath('namecheap', '/a/nc');
    await rememberProfilePath('godaddy', '/b/gd');
    const raw = await readFile(join(tempHome, '.vybekiit/automate-profiles.json'), 'utf8');
    const manifest = JSON.parse(raw) as Record<string, { path: string }>;
    expect(manifest.namecheap?.path).toBe('/a/nc');
    expect(manifest.godaddy?.path).toBe('/b/gd');
  });
});
