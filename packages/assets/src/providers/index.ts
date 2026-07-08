import type {
  AssetAppConfigType,
  AssetAwsConfigType,
  AssetCloudflareConfigType,
  AssetR2ConfigType,
  AssetSupabaseConfigType,
} from '@vybekiit/assets/config';
import { runOptimizeForBuild } from '@vybekiit/assets/optimize';
import {
  type AssetDeliveryProvider,
  AssetError,
  type AssetUrlOptionsType,
} from '@vybekiit/assets/types';
import { Effect } from 'effect';

type CloudflareR2DeliveryConfig = {
  readonly cloudflare: AssetCloudflareConfigType;
  readonly r2: AssetR2ConfigType;
  readonly app: AssetAppConfigType;
};

type CloudflareSupabaseDeliveryConfig = {
  readonly cloudflare: AssetCloudflareConfigType;
  readonly supabase: AssetSupabaseConfigType;
  readonly app: AssetAppConfigType;
};

type VercelDeliveryConfig = {
  readonly app: AssetAppConfigType;
};

type AwsS3DeliveryConfig = {
  readonly aws: AssetAwsConfigType;
  readonly app: AssetAppConfigType;
};

const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const trimLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value.slice(1) : value;

const isRemoteUrl = (src: string): boolean =>
  src.startsWith('http://') || src.startsWith('https://');

const resolveAssetFormat = (opts: AssetUrlOptionsType | undefined): 'webp' | 'avif' | 'auto' => {
  if (opts === undefined || opts.format === undefined) {
    return 'auto';
  }

  return opts.format;
};

const createDeliveryConfigError = (message: string): AssetError =>
  new AssetError({ code: 'ASSET_DELIVERY_NOT_CONFIGURED', message });

const cloudflareImageResizeUrl = (
  zoneOrigin: string,
  src: string,
  opts?: AssetUrlOptionsType | undefined,
): string => {
  const base = trimTrailingSlash(zoneOrigin);
  const params: string[] = [];

  if (opts !== undefined && opts.width !== undefined) {
    params.push(`width=${opts.width}`);
  }

  params.push(`format=${resolveAssetFormat(opts)}`);

  const query = params.join(',');
  const sourceUrl = isRemoteUrl(src) ? src : `${base}/${trimLeadingSlash(src)}`;
  const encoded = encodeURIComponent(sourceUrl);

  return `${base}/cdn-cgi/image/${query}/${encoded}`;
};

const verifyNonEmpty = (value: string, message: string): Effect.Effect<true, AssetError> => {
  if (value.length === 0) {
    return Effect.fail(createDeliveryConfigError(message));
  }

  return Effect.succeed(true);
};

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

/**
 * Build the AWS S3 asset delivery adapter.
 *
 * @param config - AWS and app config decoded by the asset resolver.
 * @returns An AssetDeliveryProvider that builds S3 or CloudFront-backed asset URLs.
 * @example
 * const provider = createAwsS3Delivery({ aws, app });
 */
export const createAwsS3Delivery = (config: AwsS3DeliveryConfig): AssetDeliveryProvider => {
  const appUrl = trimTrailingSlash(config.app.APP_URL);
  const base =
    config.aws.AWS_CLOUDFRONT_DOMAIN === undefined
      ? appUrl
      : trimTrailingSlash(config.aws.AWS_CLOUDFRONT_DOMAIN);

  return {
    name: 'aws-s3',
    optimizeForBuild: (options) => runOptimizeForBuild(options),
    url: (src, opts) => {
      const path = isRemoteUrl(src) ? src : `${base}/${trimLeadingSlash(src)}`;

      if (
        opts === undefined ||
        (opts.width === undefined && (opts.format === undefined || opts.format === 'auto'))
      ) {
        return path;
      }

      const params = new URLSearchParams();

      if (opts.width !== undefined) {
        params.set('w', String(opts.width));
      }

      if (opts.format !== undefined && opts.format !== 'auto') {
        params.set('format', opts.format);
      }

      const query = params.toString();

      if (query.length === 0) {
        return path;
      }

      return `${path}?${query}`;
    },
    verifyDelivery: () => verifyNonEmpty(config.aws.AWS_REGION, 'AWS region missing'),
  };
};
