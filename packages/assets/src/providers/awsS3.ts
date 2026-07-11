import type { AssetAppConfigType, AssetAwsConfigType } from '@vybekiit/assets/config';
import { runOptimizeForBuild } from '@vybekiit/assets/optimize';
import type { AssetDeliveryProvider } from '@vybekiit/assets/types';
import { isRemoteUrl, trimLeadingSlash, trimTrailingSlash, verifyNonEmpty } from './deliveryShared';

type AwsS3DeliveryConfig = {
  readonly aws: AssetAwsConfigType;
  readonly app: AssetAppConfigType;
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
