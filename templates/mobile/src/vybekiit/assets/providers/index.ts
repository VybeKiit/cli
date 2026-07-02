import {
  type AppConfig,
  type AwsConfig,
  type CloudflareConfig,
  type R2Config,
  type SupabaseConfig,
  fail,
  ok,
  type Result,
} from '@vybekiit/core';
import type { AssetDeliveryProvider, AssetUrlOptions } from '../types';

/** Passthrough delivery — used before Cloudflare/Supabase credentials exist. */
export function createLocalAssetDelivery(): AssetDeliveryProvider {
  return {
    name: 'local',

    url(src: string, _opts?: AssetUrlOptions): string {
      return src;
    },

    async verifyDelivery(): Promise<Result<true>> {
      return ok(true);
    },
  };
}

interface CloudflareR2DeliveryConfig {
  readonly cloudflare: CloudflareConfig;
  readonly r2: R2Config;
  readonly app: AppConfig;
}

function cloudflareImageResizeUrl(zoneOrigin: string, src: string, opts?: AssetUrlOptions): string {
  const base = zoneOrigin.replace(/\/$/, '');
  const params: string[] = [];
  if (opts?.width) {
    params.push(`width=${opts.width}`);
  }
  const format = opts?.format ?? 'auto';
  params.push(`format=${format}`);
  const query = params.join(',');
  const encoded = encodeURIComponent(
    src.startsWith('http') ? src : `${base}/${src.replace(/^\//, '')}`,
  );
  return `${base}/cdn-cgi/image/${query}/${encoded}`;
}

export function createCloudflareR2Delivery(
  config: CloudflareR2DeliveryConfig,
): AssetDeliveryProvider {
  const zoneOrigin = config.app.APP_URL.replace(/\/$/, '');
  const r2Public = config.r2.R2_PUBLIC_URL.replace(/\/$/, '');

  return {
    name: 'cloudflare-r2',

    url(src: string, opts?: AssetUrlOptions): string {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return cloudflareImageResizeUrl(zoneOrigin, src, opts);
      }
      const objectUrl = `${r2Public}/${src.replace(/^\//, '')}`;
      return cloudflareImageResizeUrl(zoneOrigin, objectUrl, opts);
    },

    async verifyDelivery(): Promise<Result<true>> {
      if (!(r2Public && config.cloudflare.CLOUDFLARE_ACCOUNT_ID)) {
        return fail(
          'assets_delivery_not_configured',
          'R2 public URL or Cloudflare account missing',
        );
      }
      return ok(true);
    },
  };
}

interface CloudflareSupabaseDeliveryConfig {
  readonly cloudflare: CloudflareConfig;
  readonly supabase: SupabaseConfig;
  readonly app: AppConfig;
}

export function createCloudflareSupabaseDelivery(
  config: CloudflareSupabaseDeliveryConfig,
): AssetDeliveryProvider {
  const zoneOrigin = config.app.APP_URL.replace(/\/$/, '');
  const supabaseOrigin = config.supabase.SUPABASE_URL.replace(/\/$/, '');

  return {
    name: 'cloudflare-supabase',

    url(src: string, opts?: AssetUrlOptions): string {
      const resolved =
        src.startsWith('http://') || src.startsWith('https://')
          ? src
          : `${supabaseOrigin}/storage/v1/object/public/${src.replace(/^\//, '')}`;
      return cloudflareImageResizeUrl(zoneOrigin, resolved, opts);
    },

    async verifyDelivery(): Promise<Result<true>> {
      if (!supabaseOrigin) {
        return fail('assets_delivery_not_configured', 'Supabase URL missing');
      }
      return ok(true);
    },
  };
}

interface VercelDeliveryConfig {
  readonly app: AppConfig;
}

export function createVercelDelivery(config: VercelDeliveryConfig): AssetDeliveryProvider {
  const appUrl = config.app.APP_URL.replace(/\/$/, '');

  return {
    name: 'vercel',

    url(src: string, opts?: AssetUrlOptions): string {
      const absolute =
        src.startsWith('http://') || src.startsWith('https://')
          ? src
          : `${appUrl}/${src.replace(/^\//, '')}`;
      const params = new URLSearchParams({ url: absolute });
      if (opts?.width) {
        params.set('w', String(opts.width));
      }
      const format = opts?.format ?? 'auto';
      if (format !== 'auto') {
        params.set('fm', format);
      }
      return `${appUrl}/_next/image?${params.toString()}`;
    },

    async verifyDelivery(): Promise<Result<true>> {
      return ok(true);
    },
  };
}

interface AwsS3DeliveryConfig {
  readonly aws: AwsConfig;
  readonly app: AppConfig;
  readonly cloudFrontDomain?: string | undefined;
}

export function createAwsS3Delivery(config: AwsS3DeliveryConfig): AssetDeliveryProvider {
  const appUrl = config.app.APP_URL.replace(/\/$/, '');
  const cfDomain = config.cloudFrontDomain?.replace(/\/$/, '');

  return {
    name: 'aws-s3',

    url(src: string, opts?: AssetUrlOptions): string {
      const base = cfDomain ?? appUrl;
      const path = src.startsWith('http') ? src : `${base}/${src.replace(/^\//, '')}`;
      if (!(opts?.width || opts?.format)) {
        return path;
      }
      const params = new URLSearchParams();
      if (opts.width) {
        params.set('w', String(opts.width));
      }
      if (opts.format && opts.format !== 'auto') {
        params.set('format', opts.format);
      }
      const qs = params.toString();
      return qs ? `${path}?${qs}` : path;
    },

    async verifyDelivery(): Promise<Result<true>> {
      if (!config.aws.AWS_REGION) {
        return fail('assets_delivery_not_configured', 'AWS region missing');
      }
      return ok(true);
    },
  };
}
