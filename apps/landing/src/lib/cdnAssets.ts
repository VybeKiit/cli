/**
 * Public CDN base for landing static assets (brand marks, logos) hosted on Cloudflare R2.
 *
 * Override with `NEXT_PUBLIC_ASSETS_BASE_URL` (no trailing slash).
 * Objects are uploaded as WebP with `Cache-Control: public, max-age=86400`.
 */
export const DEFAULT_ASSETS_BASE_URL = 'https://pub-e43389539f974d69b9ec3c1fb0f08dd6.r2.dev';

const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

/**
 * Resolve the public asset origin used by the landing storefront.
 *
 * @returns Origin URL without a trailing slash.
 * @example
 * const base = assetsBaseUrl();
 */
export const assetsBaseUrl = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
  if (fromEnv !== undefined && fromEnv.trim() !== '') {
    return trimTrailingSlash(fromEnv.trim());
  }
  return DEFAULT_ASSETS_BASE_URL;
};

/**
 * Normalize a site-relative public path (leading slash, no CDN rewrite).
 *
 * @param path - Public path (e.g. `brand-marks/claude.webp` or `/brand-marks/claude.webp`).
 * @returns Path starting with `/`.
 * @example
 * const local = localPublicPath('brand-marks/claude.webp'); // '/brand-marks/claude.webp'
 */
export const localPublicPath = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

/**
 * Map a site-relative public path to the R2 CDN URL.
 *
 * Already-absolute `http(s)://` URLs are returned unchanged. Relative paths without a
 * leading slash get one before joining.
 *
 * In local `next dev` (no `NEXT_PUBLIC_ASSETS_BASE_URL` override), returns the same-origin
 * `/public` path so brand marks work before they are uploaded to R2.
 *
 * @param path - Public path (e.g. `/brand-marks/claude.webp`) or absolute URL.
 * @returns Absolute CDN URL, local public path in dev, or the original absolute URL.
 * @example
 * const src = cdnAssetUrl('/brand-marks/claude.webp');
 */
export const cdnAssetUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = localPublicPath(path);
  // Prefer Next `/public` while iterating on marks; R2 may lag until upload-assets:r2.
  const hasExplicitCdn =
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL.trim() !== '';
  if (process.env.NODE_ENV === 'development' && !hasExplicitCdn) {
    return normalized;
  }
  return `${assetsBaseUrl()}${normalized}`;
};
