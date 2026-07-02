import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AssetManifest } from './types';
import process from 'node:process';

/**
 * Next.js `images.remotePatterns` derived from the active stack — allows optimized
 * remote uploads (R2, Supabase, Vercel) through `next/image`.
 */
export function getNextImageRemotePatterns(
  env: Record<string, string | undefined> = process.env,
): Array<{ protocol: 'https'; hostname: string; pathname: string }> {
  const patterns: Array<{ protocol: 'https'; hostname: string; pathname: string }> = [];
  const add = (url: string | undefined): void => {
    if (!url) return;
    try {
      const host = new URL(url).hostname;
      if (host) {
        patterns.push({ protocol: 'https', hostname: host, pathname: '/**' });
      }
    } catch {
      // ignore invalid URLs
    }
  };

  add(env.APP_URL);
  add(env.SUPABASE_URL);
  add(env.R2_PUBLIC_URL);
  if (env.AWS_CLOUDFRONT_DOMAIN?.startsWith('http')) {
    add(env.AWS_CLOUDFRONT_DOMAIN);
  }

  return patterns;
}

/**
 * Resolve a local public path to its build-optimized variant when a manifest exists.
 */
export function resolveLocalAssetSrc(
  src: string,
  publicDir: string,
  manifestName = 'asset-manifest.json',
): string {
  if (!src.startsWith('/')) {
    return src;
  }
  const manifestPath = join(publicDir, manifestName);
  if (!existsSync(manifestPath)) {
    return src;
  }
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as AssetManifest;
    const rel = src.replace(/^\//, '');
    const entry = manifest.files[rel];
    if (entry?.variants?.webp) {
      return `/${entry.variants.webp}`;
    }
    if (entry?.optimized) {
      return `/${entry.optimized}`;
    }
  } catch {
    return src;
  }
  return src;
}
