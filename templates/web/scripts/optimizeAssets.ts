import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  type AssetError,
  type OptimizeBuildResultType,
  resolveAssetDelivery,
} from '@vybekiit/assets';
import { Effect } from 'effect';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const optimizeProgram: Effect.Effect<OptimizeBuildResultType, AssetError> = resolveAssetDelivery(
  process.env,
).pipe(Effect.flatMap((delivery) => delivery.optimizeForBuild({ sourceDir: publicDir })));
const result = await Effect.runPromise(optimizeProgram);

process.stdout.write(
  `[optimize-assets] processed ${result.processedCount} file(s); manifest at ${result.manifestPath}\n`,
);
