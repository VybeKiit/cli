import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import { Effect } from 'effect';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';
import {
  AssetError,
  type AssetManifest,
  type AssetManifestEntry,
  type OptimizeBuildOptions,
  type OptimizeBuildResult,
} from './types';

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.tiff']);
const RASTER_SOURCE_PRIORITY = ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.webp', '.avif'];
const SVG_EXT = '.svg';
const MAX_WIDTH = 1920;
const QUALITY = 80;
// swap the trailing file extension: "img.png" -> "img.webp"
const FILE_EXTENSION_PATTERN = /\.[^.]+$/;

const toAssetErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const createOptimizeError = (message: string): AssetError =>
  new AssetError({ code: 'ASSET_OPTIMIZE_FAILED', message });

type ProcessedAsset = {
  readonly rel: string;
  readonly entry: AssetManifestEntry;
};

const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const entryFiles = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(full);
      }

      if (entry.isFile()) {
        return [full];
      }

      return [];
    }),
  );

  return entryFiles.flat();
};

const isRaster = (path: string): boolean => RASTER_EXT.has(extname(path).toLowerCase());

const rasterStemKey = (path: string): string => {
  const extension = extname(path);
  return join(dirname(path), basename(path, extension));
};

const rasterPriority = (path: string): number => {
  const priority = RASTER_SOURCE_PRIORITY.indexOf(extname(path).toLowerCase());

  if (priority === -1) {
    return RASTER_SOURCE_PRIORITY.length;
  }

  return priority;
};

const selectCanonicalRasterFiles = (files: readonly string[]): ReadonlySet<string> => {
  const canonicalByStem = new Map<string, string>();

  for (const filePath of files) {
    if (isRaster(filePath)) {
      const stem = rasterStemKey(filePath);
      const existing = canonicalByStem.get(stem);

      if (existing === undefined || rasterPriority(filePath) < rasterPriority(existing)) {
        canonicalByStem.set(stem, filePath);
      }
    }
  }

  return new Set(canonicalByStem.values());
};

const resizeOptions = (
  resizeWidth: number | undefined,
): { readonly width: number; readonly withoutEnlargement: true } | undefined => {
  if (resizeWidth === undefined) {
    return;
  }

  return { width: resizeWidth, withoutEnlargement: true };
};

const optimizeRaster = async (
  sourcePath: string,
  outputPath: string,
): Promise<Record<string, string>> => {
  const image = sharp(sourcePath);
  const meta = await image.metadata();
  const width = meta.width === undefined ? MAX_WIDTH : meta.width;
  const resizeWidth = width > MAX_WIDTH ? MAX_WIDTH : undefined;

  const webpPath = outputPath.replace(FILE_EXTENSION_PATTERN, '.webp');
  const avifPath = outputPath.replace(FILE_EXTENSION_PATTERN, '.avif');
  const variants: Record<string, string> = {};

  if (webpPath !== sourcePath) {
    await sharp(sourcePath)
      .resize(resizeOptions(resizeWidth))
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    variants.webp = webpPath;
  }

  if (avifPath !== sourcePath) {
    await sharp(sourcePath)
      .resize(resizeOptions(resizeWidth))
      .avif({ quality: QUALITY })
      .toFile(avifPath);
    variants.avif = avifPath;
  }

  if (extname(sourcePath).toLowerCase() === '.png' && meta.hasAlpha) {
    const pngPath = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;

    if (pngPath !== sourcePath) {
      await sharp(sourcePath)
        .resize(resizeOptions(resizeWidth))
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(pngPath);
    }

    variants.png = pngPath;
    return variants;
  }

  return variants;
};

const optimizeSvgFile = async (sourcePath: string, outputPath: string): Promise<void> => {
  const input = await readFile(sourcePath, 'utf8');
  const result = optimizeSvg(input, { multipass: true, plugins: ['preset-default'] });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.data);
};

const directoryExists = async (path: string): Promise<boolean> => {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
};

const optimizeAssetFile = async (
  filePath: string,
  sourceDir: string,
  outputDir: string,
): Promise<ProcessedAsset | undefined> => {
  const rel = relative(sourceDir, filePath);
  const outPath = join(outputDir, rel);

  try {
    if (extname(filePath).toLowerCase() === SVG_EXT) {
      await optimizeSvgFile(filePath, outPath);
      return {
        rel,
        entry: {
          source: rel,
          optimized: rel,
          variants: {},
        },
      };
    }

    if (!isRaster(filePath)) {
      return;
    }

    await mkdir(dirname(outPath), { recursive: true });
    const variants = await optimizeRaster(filePath, outPath);
    const relVariants: Record<string, string> = {};
    let optimized = rel;

    for (const [key, path] of Object.entries(variants)) {
      const relVariant = relative(outputDir, path);
      relVariants[key] = relVariant;

      if (key === 'webp') {
        optimized = relVariant;
      }
    }

    return {
      rel,
      entry: {
        source: rel,
        optimized,
        variants: relVariants,
      },
    };
  } catch (caught) {
    throw createOptimizeError(`Failed to optimize ${rel}: ${toAssetErrorMessage(caught)}`);
  }
};

const runOptimizeForBuildUnsafe = async (
  options: OptimizeBuildOptions,
): Promise<OptimizeBuildResult> => {
  const outputDir = options.outputDir === undefined ? options.sourceDir : options.outputDir;
  const manifestName =
    options.manifestName === undefined ? 'asset-manifest.json' : options.manifestName;
  const manifestPath = join(outputDir, manifestName);
  const files: Record<string, AssetManifestEntry> = {};
  const manifest: AssetManifest = { files };

  let processedCount = 0;

  if (!(await directoryExists(options.sourceDir))) {
    await mkdir(outputDir, { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return { manifest, manifestPath, processedCount };
  }

  const allFiles = await walkFiles(options.sourceDir);
  const canonicalRasterFiles = selectCanonicalRasterFiles(allFiles);
  const inputFiles = allFiles.filter(
    (filePath) => !isRaster(filePath) || canonicalRasterFiles.has(filePath),
  );
  const optimizedFiles = await Promise.all(
    inputFiles.map((filePath) => optimizeAssetFile(filePath, options.sourceDir, outputDir)),
  );
  const processedAssets = optimizedFiles.filter(
    (asset): asset is ProcessedAsset => asset !== undefined,
  );

  for (const asset of processedAssets) {
    files[asset.rel] = asset.entry;
  }

  processedCount = processedAssets.length;

  await mkdir(outputDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { manifest, manifestPath, processedCount };
};

/**
 * Scan a directory, compress rasters and SVGs, and write an asset manifest.
 *
 * @param options - Build optimizer input paths and manifest name.
 * @returns An Effect that succeeds with the manifest result or fails with AssetError.
 * @example
 * const result = await Effect.runPromise(runOptimizeForBuild({ sourceDir: 'public' }));
 */
export const runOptimizeForBuild = (
  options: OptimizeBuildOptions,
): Effect.Effect<OptimizeBuildResult, AssetError> =>
  Effect.tryPromise({
    try: () => runOptimizeForBuildUnsafe(options),
    catch: (caught) => createOptimizeError(toAssetErrorMessage(caught)),
  });
