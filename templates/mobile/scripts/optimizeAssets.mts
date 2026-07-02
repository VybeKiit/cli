import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { runOptimizeForBuild } from './optimize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');
const result = await runOptimizeForBuild({ sourceDir: assetsDir });
console.log(`[optimize-assets] processed ${result.processedCount} raster/SVG file(s) in assets/`);

const iconSvg = join(assetsDir, 'icon.svg');
if (existsSync(iconSvg)) {
  const iconPng = join(assetsDir, 'icon.png');
  const splashPng = join(assetsDir, 'splash.png');
  await sharp(iconSvg).resize(1024, 1024).png({ compressionLevel: 9 }).toFile(iconPng);
  await sharp(iconSvg).resize(1284, 2778).png({ compressionLevel: 9 }).toFile(splashPng);
  console.log('[optimize-assets] generated icon.png and splash.png for Expo');
}
