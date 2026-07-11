import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { KIT_MIRROR_REPO, kitBuyerReadme, stageKitTree } from './syncKitMirror.mjs';

describe('syncKitMirror staging', () => {
  /** @type {string | undefined} */
  let stageParent;

  afterEach(async () => {
    if (stageParent !== undefined) {
      await rm(stageParent, { recursive: true, force: true });
      stageParent = undefined;
    }
  });

  it('exports the create-app delivery repo name', () => {
    expect(KIT_MIRROR_REPO).toBe('kit');
  });

  it('buyer README points at setup + create app, not Download ZIP', () => {
    const readme = kitBuyerReadme();
    expect(readme).toContain('npx vybekiit setup');
    expect(readme).toContain('npx vybekiit create app --web');
    expect(readme).toContain('Download ZIP');
    expect(readme).not.toContain('vybekiit new ');
  });

  it('stages packages/, templates/, and workspace root files', async () => {
    stageParent = await mkdtemp(join(tmpdir(), 'vybekiit-kit-stage-'));
    const stageDir = join(stageParent, 'kit');
    await stageKitTree(stageDir);

    await expect(access(join(stageDir, 'packages'))).resolves.toBeUndefined();
    await expect(access(join(stageDir, 'templates', 'web'))).resolves.toBeUndefined();
    await expect(access(join(stageDir, 'pnpm-workspace.yaml'))).resolves.toBeUndefined();
    await expect(access(join(stageDir, 'package.json'))).resolves.toBeUndefined();

    const readme = await readFile(join(stageDir, 'README.md'), 'utf8');
    expect(readme).toContain('create app --web');
  });
});
