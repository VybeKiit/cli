import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { decodeAssetManifest } from '@vybekiit/core/http';
import { Effect } from 'effect';
import { AssetError, type AssetManifest } from './types';

type NextImageRemotePattern = {
  readonly protocol: 'https';
  readonly hostname: string;
  readonly pathname: string;
};

type AssetManifestErrorCode =
  | 'ASSET_MANIFEST_MISSING'
  | 'ASSET_MANIFEST_INVALID'
  | 'ASSET_MANIFEST_ENTRY_MISSING';

const addRemotePattern = (
  patterns: Array<NextImageRemotePattern>,
  url: string | undefined,
): void => {
  if (url === undefined || !URL.canParse(url)) {
    return;
  }

  const host = new URL(url).hostname;

  if (host.length > 0) {
    patterns.push({ protocol: 'https', hostname: host, pathname: '/**' });
  }
};

const createAssetManifestError = (code: AssetManifestErrorCode, message: string): AssetError =>
  new AssetError({ code, message });

const toAssetManifestErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const readAssetManifestJson = (manifestPath: string): Effect.Effect<unknown, AssetError> => {
  if (!existsSync(manifestPath)) {
    return Effect.fail(
      createAssetManifestError(
        'ASSET_MANIFEST_MISSING',
        `Asset manifest does not exist at ${manifestPath}.`,
      ),
    );
  }

  return Effect.try({
    try: () => {
      const raw: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
      return raw;
    },
    catch: (caught) =>
      createAssetManifestError(
        'ASSET_MANIFEST_INVALID',
        `Asset manifest at ${manifestPath} could not be read: ${toAssetManifestErrorMessage(caught)}`,
      ),
  });
};

const decodeManifest = (
  raw: unknown,
  manifestPath: string,
): Effect.Effect<AssetManifest, AssetError> => {
  const manifest = decodeAssetManifest(raw);

  if (manifest === null) {
    return Effect.fail(
      createAssetManifestError(
        'ASSET_MANIFEST_INVALID',
        `Asset manifest at ${manifestPath} does not match the expected shape.`,
      ),
    );
  }

  return Effect.succeed(manifest);
};

/**
 * Build Next.js image remote patterns from known asset origins.
 *
 * @param env - Environment object to read, usually `process.env` in `next.config.ts`.
 * @returns Remote image patterns accepted by Next.js.
 * @example
 * const patterns = getNextImageRemotePatterns(process.env);
 */
export const getNextImageRemotePatterns = (
  env: Record<string, string | undefined> = process.env,
): Array<NextImageRemotePattern> => {
  const patterns: Array<NextImageRemotePattern> = [];

  addRemotePattern(patterns, env.APP_URL);
  addRemotePattern(patterns, env.SUPABASE_URL);
  addRemotePattern(patterns, env.R2_PUBLIC_URL);

  if (env.AWS_CLOUDFRONT_DOMAIN?.startsWith('http') === true) {
    addRemotePattern(patterns, env.AWS_CLOUDFRONT_DOMAIN);
  }

  return patterns;
};

/**
 * Resolve a local public path to its build-optimized variant when a manifest exists.
 *
 * @param src - Public path requested by the app.
 * @param publicDir - Absolute path to the app's public directory.
 * @param manifestName - Manifest filename inside `publicDir`.
 * @returns An Effect that succeeds with the optimized public path or fails with AssetError.
 * @example
 * const src = await Effect.runPromise(resolveLocalAssetSrc('/hero.png', join(process.cwd(), 'public')));
 */
export const resolveLocalAssetSrc = (
  src: string,
  publicDir: string,
  manifestName = 'asset-manifest.json',
): Effect.Effect<string, AssetError> => {
  if (!src.startsWith('/')) {
    return Effect.fail(
      createAssetManifestError(
        'ASSET_MANIFEST_ENTRY_MISSING',
        `Asset source ${src} is not a local public path.`,
      ),
    );
  }

  const manifestPath = join(publicDir, manifestName);

  return readAssetManifestJson(manifestPath).pipe(
    Effect.flatMap((raw) => decodeManifest(raw, manifestPath)),
    Effect.flatMap((manifest) => {
      const rel = src.slice(1);
      const entry = manifest.files[rel];

      if (entry === undefined) {
        return Effect.fail(
          createAssetManifestError(
            'ASSET_MANIFEST_ENTRY_MISSING',
            `Asset manifest at ${manifestPath} does not contain ${rel}.`,
          ),
        );
      }

      if (entry.variants.webp !== undefined) {
        return Effect.succeed(`/${entry.variants.webp}`);
      }

      return Effect.succeed(`/${entry.optimized}`);
    }),
  );
};
