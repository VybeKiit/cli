import type { Result } from '@vybekiit/core';

/** Delivery backends derived from HOSTING + STORAGE — not chosen by the builder. */
export type AssetDeliveryProviderName =
  | 'local'
  | 'cloudflare-r2'
  | 'cloudflare-supabase'
  | 'vercel'
  | 'aws-s3';

export interface OptimizeBuildOptions {
  /** Directory to scan for raster/SVG assets (e.g. `public` or `assets`). */
  readonly sourceDir: string;
  /** Where optimized outputs are written (defaults to sourceDir). */
  readonly outputDir?: string;
  /** Relative path for the manifest file inside outputDir. */
  readonly manifestName?: string;
}

export interface AssetManifestEntry {
  readonly source: string;
  readonly optimized: string;
  readonly variants: Record<string, string>;
}

export interface AssetManifest {
  readonly files: Record<string, AssetManifestEntry>;
}

export interface OptimizeBuildResult {
  readonly manifest: AssetManifest;
  readonly manifestPath: string;
  readonly processedCount: number;
}

export interface AssetUrlOptions {
  readonly width?: number;
  readonly format?: 'webp' | 'avif' | 'auto';
}

/**
 * Hybrid asset delivery: build-time optimization for repo assets plus CDN transform
 * URLs for uploads and remote references. Constructed from HOSTING + STORAGE env.
 */
export interface AssetDeliveryProvider {
  readonly name: AssetDeliveryProviderName;
  optimizeForBuild(options: OptimizeBuildOptions): Promise<OptimizeBuildResult>;
  url(src: string, opts?: AssetUrlOptions): string;
  verifyDelivery(): Promise<Result<true>>;
}
