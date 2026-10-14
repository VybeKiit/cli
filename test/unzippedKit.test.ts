import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  findUnzippedKit,
  KIT_ZIP_MARKER,
  locateUnzippedKit,
  rememberUnzippedKit,
} from '../src/lib/unzippedKit';

describe('unzipped kit folder', () => {
  let sandbox = '';
  let kitRoot = '';
  let home = '';

  beforeEach(async () => {
    const createdSandbox = await mkdtemp(join(tmpdir(), 'vybekiit-unzipped-kit-'));
    sandbox = await realpath(createdSandbox);
    kitRoot = join(sandbox, 'Downloads', 'vybekiit-kit');
    home = join(sandbox, 'home');
    await mkdir(join(kitRoot, 'packages', 'core'), { recursive: true });
    await mkdir(join(kitRoot, 'templates', 'web'), { recursive: true });
    await mkdir(home, { recursive: true });
    await writeFile(join(kitRoot, KIT_ZIP_MARKER), '{"version":"0.7.32"}\n', 'utf8');
  });

  afterEach(async () => {
    await rm(sandbox, { recursive: true, force: true });
  });

  it('finds the kit from its own folder and from a folder inside it', async () => {
    await expect(findUnzippedKit(kitRoot)).resolves.toBe(kitRoot);
    await expect(findUnzippedKit(join(kitRoot, 'templates', 'web'))).resolves.toBe(kitRoot);
  });

  it('ignores a folder with packages and templates but no kit marker', async () => {
    await rm(join(kitRoot, KIT_ZIP_MARKER));
    await expect(findUnzippedKit(kitRoot)).resolves.toBeNull();
  });

  it('finds the remembered kit from an app folder outside it', async () => {
    const appFolder = join(sandbox, 'home', 'my-vybekiit-app');
    await mkdir(appFolder, { recursive: true });
    await expect(locateUnzippedKit(appFolder, home)).resolves.toBeNull();

    await rememberUnzippedKit(kitRoot, home);

    const savedText = await readFile(join(home, '.vybekiit', 'kit-folder.json'), 'utf8');
    expect(JSON.parse(savedText)).toEqual({ kitRoot });
    await expect(locateUnzippedKit(appFolder, home)).resolves.toBe(kitRoot);
  });

  it('forgets a remembered kit folder that was deleted', async () => {
    await rememberUnzippedKit(kitRoot, home);
    await rm(kitRoot, { recursive: true, force: true });

    await expect(locateUnzippedKit(home, home)).resolves.toBeNull();
  });
});
