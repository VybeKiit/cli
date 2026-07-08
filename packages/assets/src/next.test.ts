import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { resolveLocalAssetSrc } from './next';

describe('resolveLocalAssetSrc', () => {
  it('resolves the webp variant from a valid asset manifest', async () => {
    const publicDir = await mkdtemp(join(tmpdir(), 'vybekiit-assets-next-'));

    try {
      await writeFile(
        join(publicDir, 'asset-manifest.json'),
        JSON.stringify({
          files: {
            'hero.png': {
              source: 'hero.png',
              optimized: 'hero.png',
              variants: { webp: 'hero.webp' },
            },
          },
        }),
      );

      await expect(Effect.runPromise(resolveLocalAssetSrc('/hero.png', publicDir))).resolves.toBe(
        '/hero.webp',
      );
    } finally {
      await rm(publicDir, { recursive: true, force: true });
    }
  });

  it('fails when the manifest does not contain the requested source', async () => {
    const publicDir = await mkdtemp(join(tmpdir(), 'vybekiit-assets-next-'));

    try {
      await writeFile(join(publicDir, 'asset-manifest.json'), JSON.stringify({ files: {} }));

      const error = await Effect.runPromise(
        Effect.flip(resolveLocalAssetSrc('/hero.png', publicDir)),
      );

      expect(error.code).toBe('ASSET_MANIFEST_ENTRY_MISSING');
      expect(error.message).toContain('hero.png');
    } finally {
      await rm(publicDir, { recursive: true, force: true });
    }
  });

  it('fails when the manifest file is missing', async () => {
    const publicDir = await mkdtemp(join(tmpdir(), 'vybekiit-assets-next-'));

    try {
      await mkdir(publicDir, { recursive: true });

      const error = await Effect.runPromise(
        Effect.flip(resolveLocalAssetSrc('/hero.png', publicDir)),
      );

      expect(error.code).toBe('ASSET_MANIFEST_MISSING');
    } finally {
      await rm(publicDir, { recursive: true, force: true });
    }
  });
});
