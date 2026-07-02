import type { Result } from '@vybekiit/core';

/** Delivery backends derived from HOSTING + STORAGE — not chosen by the builder. */
export type AssetDeliveryProviderName =
  | 'local'
  | 'cloudflare-r2'
  | 'cloudflare-supabase'
  | 'vercel'
  | 'aws-s3';

export interface AssetUrlOptions {
  readonly width?: number;
  readonly format?: 'webp' | 'avif' | 'auto';
}

/**
 * CDN transform URLs for uploads and remote references, constructed from HOSTING + STORAGE env.
 * Build-time image optimization lives in `scripts/optimize.ts` (Node-only) so `sharp` never
 * enters the React Native bundle.
 */
export interface AssetDeliveryProvider {
  readonly name: AssetDeliveryProviderName;
  url(src: string, opts?: AssetUrlOptions): string;
  verifyDelivery(): Promise<Result<true>>;
}
