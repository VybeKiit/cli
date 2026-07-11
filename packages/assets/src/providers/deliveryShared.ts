import type { AssetUrlOptionsType } from '@vybekiit/assets/types';
import { AssetError } from '@vybekiit/assets/types';
import { Effect } from 'effect';

/**
 * Strip a single trailing slash from a URL or path segment.
 *
 * @param value - Raw URL or path.
 * @returns Value without a trailing slash.
 * @example
 * trimTrailingSlash('https://cdn.example/') === 'https://cdn.example'
 */
export const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

/**
 * Strip a single leading slash from a path segment.
 *
 * @param value - Raw path.
 * @returns Value without a leading slash.
 * @example
 * trimLeadingSlash('/images/logo.png') === 'images/logo.png'
 */
export const trimLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value.slice(1) : value;

/**
 * Whether a src is already an absolute http(s) URL.
 *
 * @param src - Asset path or URL.
 * @returns True for remote URLs.
 * @example
 * isRemoteUrl('https://cdn.example/a.png') === true
 */
export const isRemoteUrl = (src: string): boolean =>
  src.startsWith('http://') || src.startsWith('https://');

/**
 * Resolve the image format for a delivery URL option set.
 *
 * @param opts - Optional URL options from the caller.
 * @returns Format token used by delivery adapters.
 * @example
 * resolveAssetFormat({ format: 'webp' }) === 'webp'
 */
export const resolveAssetFormat = (
  opts: AssetUrlOptionsType | undefined,
): 'webp' | 'avif' | 'auto' => {
  if (opts === undefined || opts.format === undefined) {
    return 'auto';
  }

  return opts.format;
};

/**
 * Build a delivery-config error for missing hosting credentials.
 *
 * @param message - Human-readable failure message.
 * @returns Tagged AssetError with ASSET_DELIVERY_NOT_CONFIGURED.
 * @example
 * createDeliveryConfigError('Cloudflare account missing')
 */
export const createDeliveryConfigError = (message: string): AssetError =>
  new AssetError({ code: 'ASSET_DELIVERY_NOT_CONFIGURED', message });

/**
 * Fail when a required delivery config string is empty.
 *
 * @param value - Config string to check.
 * @param message - Error message when empty.
 * @returns Effect that succeeds with true or fails with AssetError.
 * @example
 * yield* verifyNonEmpty(accountId, 'Cloudflare account missing')
 */
export const verifyNonEmpty = (value: string, message: string): Effect.Effect<true, AssetError> => {
  if (value.length === 0) {
    return Effect.fail(createDeliveryConfigError(message));
  }

  return Effect.succeed(true);
};

/**
 * Build a Cloudflare `/cdn-cgi/image/` resize URL for a source asset.
 *
 * @param zoneOrigin - Site origin used as the resize base.
 * @param src - Absolute or site-relative source path.
 * @param opts - Optional width/format options.
 * @returns Cloudflare image-resize URL.
 * @example
 * cloudflareImageResizeUrl('https://app.example', '/logo.png', { width: 200 })
 */
export const cloudflareImageResizeUrl = (
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
