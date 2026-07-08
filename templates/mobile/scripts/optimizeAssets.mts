import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { runOptimizeForBuild } from './optimize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');
const iconSvg = join(assetsDir, 'icon.svg');
if (existsSync(iconSvg)) {
  const iconPng = join(assetsDir, 'icon.png');
  const splashPng = join(assetsDir, 'splash.png');
  await sharp(iconSvg).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(iconPng);
  await sharp(iconSvg).resize(1284, 2778).png({ compressionLevel: 9 }).toFile(splashPng);
  process.stdout.write('[optimize-assets] generated icon.png and splash.png for Expo\n');
}
const result = await runOptimizeForBuild({
  sourceDir: assetsDir,
  preserveSvgPaths: ['icon.svg'],
});
process.stdout.write(
  `[optimize-assets] processed ${result.processedCount} raster/SVG file(s) in assets/\n`,
);
