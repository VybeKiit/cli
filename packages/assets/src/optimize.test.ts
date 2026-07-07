import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect } from 'effect';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { runOptimizeForBuild } from './optimize';

const makeImage = () =>
  sharp({
    create: {
      width: 12,
      height: 12,
      channels: 4,
      background: { r: 16, g: 24, b: 32, alpha: 1 },
    },
  });

describe('runOptimizeForBuild', () => {
  it('uses one canonical source when generated webp and avif siblings already exist', async () => {
    const fixtureDir = await mkdtemp(join(tmpdir(), 'vybekiit-assets-'));

    try {
      await makeImage().webp().toFile(join(fixtureDir, 'badge.webp'));
      await makeImage().avif().toFile(join(fixtureDir, 'badge.avif'));

      const result = await Effect.runPromise(runOptimizeForBuild({ sourceDir: fixtureDir }));

      expect(result.processedCount).toBe(1);
      expect(Object.keys(result.manifest.files)).toEqual(['badge.webp']);
      expect(result.manifest.files['badge.webp']).toEqual({
        source: 'badge.webp',
        optimized: 'badge.webp',
        variants: { avif: 'badge.avif' },
      });
    } finally {
      await rm(fixtureDir, { recursive: true, force: true });
    }
  });
});
