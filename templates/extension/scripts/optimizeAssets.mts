import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { runOptimizeForBuild } from './optimize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
await runOptimizeForBuild({ sourceDir: publicDir });

const iconSvg = join(publicDir, 'icon', 'icon.svg');
const sizes = [16, 48, 128];
for (const size of sizes) {
  const out = join(publicDir, 'icon', `${size}.png`);
  await sharp(iconSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`[optimize-assets] wrote icon/${size}.png`);
}
