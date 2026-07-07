import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';

// Build-time only (tsx-run, excluded from the app typecheck): keeps sharp/svgo/node:fs off the
// React Native bundle. Types are inlined so this stays self-contained under `scripts/`.
type OptimizeBuildOptions = Readonly<{
  readonly sourceDir: string;
  readonly outputDir?: string;
  readonly manifestName?: string;
  readonly preserveSvgPaths?: readonly string[];
}>;

type AssetManifestEntry = Readonly<{
  readonly source: string;
  readonly optimized: string;
  readonly variants: Record<string, string>;
}>;

type AssetManifest = Readonly<{
  readonly files: Record<string, AssetManifestEntry>;
}>;

type OptimizeBuildResult = Readonly<{
  readonly manifest: AssetManifest;
  readonly manifestPath: string;
  readonly processedCount: number;
}>;

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.tiff']);
const RASTER_SOURCE_PRIORITY = ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.webp', '.avif'];
const SVG_EXT = '.svg';
const MAX_WIDTH = 1920;
const QUALITY = 80;
// swap the trailing file extension: "img.png" -> "img.webp"
const TRAILING_EXTENSION = /\.[^.]+$/;

/**
 * Recursively collect files beneath a directory.
 *
 * @param dir - Absolute or relative directory to walk.
 * @returns File paths discovered under the directory.
 * @example
 * const files = await walkFiles('assets');
 */
const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
};

/**
 * Check whether a path uses a raster image extension.
 *
 * @param path - File path to inspect.
 * @returns True when the extension can be processed by sharp.
 * @example
 * const raster = isRaster('logo.png');
 */
const isRaster = (path: string): boolean => RASTER_EXT.has(extname(path).toLowerCase());

/**
 * Build a path key shared by same-stem raster variants.
 *
 * @param path - Raster path to normalize.
 * @returns Directory plus filename without the extension.
 * @example
 * const key = rasterStemKey('icon.webp');
 */
const rasterStemKey = (path: string): string => {
  const extension = extname(path);

  return join(dirname(path), basename(path, extension));
};

/**
 * Rank raster formats from preferred source to generated fallback.
 *
 * @param path - Raster path to rank.
 * @returns Numeric priority, where lower is preferred.
 * @example
 * const priority = rasterPriority('icon.png');
 */
const rasterPriority = (path: string): number => {
  const priority = RASTER_SOURCE_PRIORITY.indexOf(extname(path).toLowerCase());

  if (priority === -1) {
    return RASTER_SOURCE_PRIORITY.length;
  }

  return priority;
};

/**
 * Select one source raster for each same-stem variant group.
 *
 * @param files - Files discovered in the source directory.
 * @returns Canonical raster file paths to optimize.
 * @example
 * const files = selectCanonicalRasterFiles(['icon.png', 'icon.webp']);
 */
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

/**
 * Build a sharp resize option object only when resizing is needed.
 *
 * @param resizeWidth - Target width or undefined when the original size is kept.
 * @returns Sharp resize options or undefined.
 * @example
 * const options = resizeOptions(1024);
 */
const resizeOptions = (
  resizeWidth: number | undefined,
): { readonly width: number; readonly withoutEnlargement: true } | undefined => {
  if (resizeWidth === undefined) {
    return;
  }

  return { width: resizeWidth, withoutEnlargement: true };
};

/**
 * Create modern raster variants for a source image.
 *
 * @param sourcePath - Source raster image path.
 * @param outputPath - Output path used to derive variant filenames.
 * @returns Map of generated variant names to absolute file paths.
 * @example
 * const variants = await optimizeRaster('assets/hero.png', 'assets/hero.png');
 */
const optimizeRaster = async (
  sourcePath: string,
  outputPath: string,
): Promise<Record<string, string>> => {
  const image = sharp(sourcePath);
  const meta = await image.metadata();
  const width = meta.width === undefined ? MAX_WIDTH : meta.width;
  const resizeWidth = width > MAX_WIDTH ? MAX_WIDTH : undefined;
  const webpPath = outputPath.replace(TRAILING_EXTENSION, '.webp');
  const avifPath = outputPath.replace(TRAILING_EXTENSION, '.avif');
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

/**
 * Minify an SVG file and write it to the output path.
 *
 * @param sourcePath - Source SVG path.
 * @param outputPath - Destination SVG path.
 * @returns A promise that resolves once the optimized SVG is written.
 * @example
 * await optimizeSvgFile('assets/icon.svg', 'dist/icon.svg');
 */
const optimizeSvgFile = async (sourcePath: string, outputPath: string): Promise<void> => {
  const input = await readFile(sourcePath, 'utf8');
  const result = optimizeSvg(input, { multipass: true, plugins: ['preset-default'] });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.data);
};

/**
 * Scan a directory, compress rasters (WebP + AVIF at perceptual defaults) and SVGs (SVGO),
 * and write an {@link AssetManifest} mapping sources to optimized variants.
 *
 * @param options - Source directory, optional output directory, manifest name, and SVG preserve list.
 * @returns Manifest metadata plus the number of processed source assets.
 * @example
 * const result = await runOptimizeForBuild({ sourceDir: 'assets', preserveSvgPaths: ['icon.svg'] });
 */
export const runOptimizeForBuild = async (
  options: OptimizeBuildOptions,
): Promise<OptimizeBuildResult> => {
  const outputDir = options.outputDir === undefined ? options.sourceDir : options.outputDir;
  const manifestName =
    options.manifestName === undefined ? 'asset-manifest.json' : options.manifestName;
  const preserveSvgPaths = new Set(
    options.preserveSvgPaths === undefined ? [] : options.preserveSvgPaths,
  );
  const manifestPath = join(outputDir, manifestName);
  const manifest: AssetManifest = { files: {} };

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
  const processedFiles = await Promise.all(
    inputFiles.map(async (filePath) => {
      const rel = relative(options.sourceDir, filePath);
      const outPath = join(outputDir, rel);

      if (extname(filePath).toLowerCase() === SVG_EXT) {
        if (!preserveSvgPaths.has(rel)) {
          await optimizeSvgFile(filePath, outPath);
        }
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
      for (const [key, path] of Object.entries(variants)) {
        relVariants[key] = relative(outputDir, path);
      }
      const webpVariant = relVariants.webp;

      return {
        rel,
        entry: {
          source: rel,
          optimized: webpVariant === undefined ? rel : webpVariant,
          variants: relVariants,
        },
      };
    }),
  );

  for (const result of processedFiles) {
    if (result !== undefined) {
      manifest.files[result.rel] = result.entry;
      processedCount += 1;
    }
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { manifest, manifestPath, processedCount };
};

/**
 * Check whether a directory can be read.
 *
 * @param path - Directory path to inspect.
 * @returns True when the directory exists and is readable.
 * @example
 * const exists = await directoryExists('assets');
 */
const directoryExists = async (path: string): Promise<boolean> => {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
};
