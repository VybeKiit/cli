import type {
  AssetAppConfigType,
  AssetCloudflareConfigType,
  AssetSupabaseConfigType,
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

type CloudflareSupabaseDeliveryConfig = {
  readonly cloudflare: AssetCloudflareConfigType;
  readonly supabase: AssetSupabaseConfigType;
  readonly app: AssetAppConfigType;
};

/**
 * Build the Cloudflare plus Supabase asset delivery adapter.
 *
 * @param config - Cloudflare, Supabase, and app config decoded by the asset resolver.
 * @returns An AssetDeliveryProvider that routes Supabase public objects through Cloudflare image resizing.
 * @example
 * const provider = createCloudflareSupabaseDelivery({ cloudflare, supabase, app });
 */
export const createCloudflareSupabaseDelivery = (
  config: CloudflareSupabaseDeliveryConfig,
): AssetDeliveryProvider => {
  const zoneOrigin = trimTrailingSlash(config.app.APP_URL);
  const supabaseOrigin = trimTrailingSlash(config.supabase.SUPABASE_URL);

  return {
    name: 'cloudflare-supabase',
    optimizeForBuild: (options) => runOptimizeForBuild(options),
    url: (src, opts) => {
      const resolved = isRemoteUrl(src)
        ? src
        : `${supabaseOrigin}/storage/v1/object/public/${trimLeadingSlash(src)}`;
      return cloudflareImageResizeUrl(zoneOrigin, resolved, opts);
    },
    verifyDelivery: () => verifyNonEmpty(supabaseOrigin, 'Supabase URL missing'),
  };
};
