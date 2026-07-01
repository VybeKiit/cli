import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildVerbContext, discoverStore } from '../../src/cli/discover';

let repoRoot: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'vybekiit-store-'));
  const storeDir = join(repoRoot, '.vybekiit', 'store', 'extension');
  await mkdir(storeDir, { recursive: true });
  await writeFile(
    join(storeDir, 'cws.json'),
    JSON.stringify({
      chromeWebStoreId: 'abcdefghijklmnopabcdefghijklmnop',
      key: 'extension',
      name: 'Test Ext',
    }),
    'utf8',
  );
});

afterEach(async () => {
  await rm(repoRoot, { force: true, recursive: true });
});

describe('discoverStore', () => {
  it('finds cws.json from nested cwd', async () => {
    const nested = join(repoRoot, 'src', 'popup');
    await mkdir(nested, { recursive: true });
    const result = await discoverStore(nested);
    expect(result.repoRoot).toBe(repoRoot);
    expect(result.store.chromeWebStoreId).toHaveLength(32);
  });

  it('builds verb context with workspace at repo root', () => {
    const ctx = buildVerbContext({
      repoRoot,
      store: { chromeWebStoreId: 'x', key: 'extension', name: 'Test' },
    });
    expect(ctx.extension.dir).toBe('.');
    expect(ctx.repoRoot).toBe(repoRoot);
  });
});
