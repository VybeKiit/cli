import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  INSTALL_STATE_FILENAME,
  readInstallState,
  writeInstallState,
} from '../../src/global/installState';

describe('installState', () => {
  it('returns null when no stamp has been written yet', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-install-state-'));
    expect(await readInstallState(dir)).toBeNull();
  });

  it('round-trips the version stamp so re-runs can detect an update', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-install-state-'));
    const written = await writeInstallState(
      dir,
      '0.6.1',
      {},
      () => new Date('2026-07-18T12:00:00.000Z'),
    );

    expect(written).toEqual({
      version: '0.6.1',
      updatedAt: '2026-07-18T12:00:00.000Z',
    });
    expect(await readInstallState(dir)).toEqual(written);

    const raw = await readFile(join(dir, INSTALL_STATE_FILENAME), 'utf8');
    expect(JSON.parse(raw)).toEqual(written);
  });

  it('persists firstAppPath across version-only updates', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-install-state-'));
    await writeInstallState(
      dir,
      '0.6.1',
      { firstAppPath: '/Users/me/vybekiit-app' },
      () => new Date('2026-07-18T12:00:00.000Z'),
    );

    const updated = await writeInstallState(
      dir,
      '0.7.0',
      {},
      () => new Date('2026-07-19T12:00:00.000Z'),
    );

    expect(updated).toEqual({
      version: '0.7.0',
      updatedAt: '2026-07-19T12:00:00.000Z',
      firstAppPath: '/Users/me/vybekiit-app',
    });
    expect(await readInstallState(dir)).toEqual(updated);
  });

  it('treats a corrupt stamp as a first install', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-install-state-'));
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(dir, INSTALL_STATE_FILENAME), '{not-json', 'utf8');
    expect(await readInstallState(dir)).toBeNull();
  });
});
