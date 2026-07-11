import { runOptimizeForBuild } from '@vybekiit/assets/optimize';
import type { AssetDeliveryProvider } from '@vybekiit/assets/types';
import { Effect } from 'effect';

/**
 * Build the local asset delivery adapter for offline scaffolds and tests.
 *
 * @returns An AssetDeliveryProvider that optimizes local assets and returns URLs unchanged.
 * @example
 * const provider = createLocalAssetDelivery();
 */
export const createLocalAssetDelivery = (): AssetDeliveryProvider => ({
  name: 'local',
  optimizeForBuild: (options) => runOptimizeForBuild(options),
  url: (src) => src,
  verifyDelivery: () => Effect.succeed(true),
});
