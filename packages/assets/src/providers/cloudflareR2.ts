import type {
  AssetAppConfigType,
  AssetCloudflareConfigType,
  AssetR2ConfigType,
} from '@vybekiit/assets/config';
import { runOptimizeForBuild } from '@vybekiit/assets/optimize';
import type { AssetDeliveryProvider } from '@vybekiit/assets/types';
import {
  cloudflareImageResizeUrl,
  isRemoteUrl,
  trimLeadingSlash,
  trimTrailingSlash,
  verifyNonEmpty,
} from './deliveryShared';

type CloudflareR2DeliveryConfig = {
  readonly cloudflare: AssetCloudflareConfigType;
  readonly r2: AssetR2ConfigType;
  readonly app: AssetAppConfigType;
};

/**
 * Build the Cloudflare R2 asset delivery adapter.
 *
 * @param config - Cloudflare, R2, and app config decoded by the asset resolver.
 * @returns An AssetDeliveryProvider that routes object URLs through Cloudflare image resizing.
 * @example
 * const provider = createCloudflareR2Delivery({ cloudflare, r2, app });
 */
export const createCloudflareR2Delivery = (
  config: CloudflareR2DeliveryConfig,
): AssetDeliveryProvider => {
  const zoneOrigin = trimTrailingSlash(config.app.APP_URL);
  const r2Public = trimTrailingSlash(config.r2.R2_PUBLIC_URL);

  return {
    name: 'cloudflare-r2',
    optimizeForBuild: (options) => runOptimizeForBuild(options),
    url: (src, opts) => {
      if (isRemoteUrl(src)) {
        return cloudflareImageResizeUrl(zoneOrigin, src, opts);
      }

      const objectUrl = `${r2Public}/${trimLeadingSlash(src)}`;
      return cloudflareImageResizeUrl(zoneOrigin, objectUrl, opts);
    },
    verifyDelivery: () =>
      verifyNonEmpty(config.cloudflare.CLOUDFLARE_ACCOUNT_ID, 'Cloudflare account missing'),
  };
};
