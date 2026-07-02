import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAssetDelivery } from '@/vybekiit/assets';
import process from 'node:process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const delivery = resolveAssetDelivery(process.env);
const result = await delivery.optimizeForBuild({ sourceDir: publicDir });
console.log(
  `[optimize-assets] processed ${result.processedCount} file(s); manifest at ${result.manifestPath}`,
);
