import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { runOptimizeForBuild } from './optimize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const iconSvg = join(publicDir, 'icon', 'icon.svg');
const sizes = [16, 48, 128] as const;
await Promise.all(
  sizes.map(async (size) => {
    const out = join(publicDir, 'icon', `${size}.png`);
    await sharp(iconSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
    process.stdout.write(`[optimize-assets] wrote icon/${size}.png\n`);
  }),
);
const result = await runOptimizeForBuild({
  sourceDir: publicDir,
  preserveSvgPaths: ['icon/icon.svg', 'vybekiit-logo.svg'],
});
process.stdout.write(
  `[optimize-assets] processed ${result.processedCount} raster/SVG file(s) in public/\n`,
);
