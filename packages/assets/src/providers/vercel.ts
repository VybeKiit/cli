import type { AssetAppConfigType } from '@vybekiit/assets/config';
import { runOptimizeForBuild } from '@vybekiit/assets/optimize';
import type { AssetDeliveryProvider } from '@vybekiit/assets/types';
import { Effect } from 'effect';
import {
  isRemoteUrl,
  resolveAssetFormat,
  trimLeadingSlash,
  trimTrailingSlash,
} from './deliveryShared';

type VercelDeliveryConfig = {
  readonly app: AssetAppConfigType;
};

/**
 * Build the Vercel asset delivery adapter.
 *
 * @param config - App config decoded by the asset resolver.
 * @returns An AssetDeliveryProvider that maps remote images through the Next image route.
 * @example
 * const provider = createVercelDelivery({ app });
 */
export const createVercelDelivery = (config: VercelDeliveryConfig): AssetDeliveryProvider => {
  const appUrl = trimTrailingSlash(config.app.APP_URL);

  return {
    name: 'vercel',
    optimizeForBuild: (options) => runOptimizeForBuild(options),
    url: (src, opts) => {
      const absolute = isRemoteUrl(src) ? src : `${appUrl}/${trimLeadingSlash(src)}`;
      const params = new URLSearchParams({ url: absolute });
      const format = resolveAssetFormat(opts);

      if (opts !== undefined && opts.width !== undefined) {
        params.set('w', String(opts.width));
      }

      if (format !== 'auto') {
        params.set('fm', format);
      }

      return `${appUrl}/_next/image?${params.toString()}`;
    },
    verifyDelivery: () => Effect.succeed(true),
  };
};
