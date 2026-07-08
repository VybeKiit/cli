import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';

// Build-time only (tsx-run, excluded from the app typecheck): keeps sharp/svgo/node:fs out of
// the extension bundle. Types are inlined so this stays self-contained under `scripts/`.
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

type NormalizedOptimizeOptions = Readonly<{
  readonly outputDir: string;
  readonly manifestName: string;
  readonly preserveSvgPaths: ReadonlySet<string>;
}>;

type ProcessAssetOptions = Readonly<{
  readonly sourceDir: string;
  readonly outputDir: string;
  readonly preserveSvgPaths: ReadonlySet<string>;
}>;

type ProcessAssetResult = Readonly<{
  readonly rel: string;
  readonly entry: AssetManifestEntry;
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
 * const files = await walkFiles('public');
 */
const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const fileGroups = await Promise.all(
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

  return fileGroups.flat();
};

/**
 * Check whether a path uses a raster image extension.
 *
 * @param path - File path to inspect.
 * @returns True when the extension can be processed by sharp.
 * @example
 * const raster = isRaster('icon.png');
 */
const isRaster = (path: string): boolean => RASTER_EXT.has(extname(path).toLowerCase());

/**
 * Build a path key shared by same-stem raster variants.
 *
 * @param path - Raster path to normalize.
 * @returns Directory plus filename without the extension.
 * @example
 * const key = rasterStemKey('icon/16.webp');
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
 * const priority = rasterPriority('icon/16.png');
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
 * const variants = await optimizeRaster('public/icon.png', 'public/icon.png');
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
 * await optimizeSvgFile('public/icon.svg', 'dist/icon.svg');
 */
const optimizeSvgFile = async (sourcePath: string, outputPath: string): Promise<void> => {
  const input = await readFile(sourcePath, 'utf8');
  const result = optimizeSvg(input, { multipass: true, plugins: ['preset-default'] });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.data);
};

/**
 * Normalize optional build settings before processing assets.
 *
 * @param options - User-provided build options.
 * @returns Fully resolved output directory, manifest name, and SVG preserve set.
 * @example
 * const options = normalizeOptimizeOptions({ sourceDir: 'public', preserveSvgPaths: ['icon.svg'] });
 */
const normalizeOptimizeOptions = (options: OptimizeBuildOptions): NormalizedOptimizeOptions => {
  const outputDir = options.outputDir === undefined ? options.sourceDir : options.outputDir;
  const manifestName =
    options.manifestName === undefined ? 'asset-manifest.json' : options.manifestName;
  const preserveSvgPaths = new Set(
    options.preserveSvgPaths === undefined ? [] : options.preserveSvgPaths,
  );

  return { outputDir, manifestName, preserveSvgPaths };
};

/**
 * Write an asset manifest file with stable formatting.
 *
 * @param manifestPath - Destination manifest path.
 * @param manifest - Manifest payload to write.
 * @returns A promise that resolves after the file is written.
 * @example
 * await writeAssetManifest('public/asset-manifest.json', { files: {} });
 */
const writeAssetManifest = async (manifestPath: string, manifest: AssetManifest): Promise<void> => {
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

/**
 * Optimize one asset and build its manifest entry.
 *
 * @param filePath - Source asset path to process.
 * @param options - Source/output directories and SVG preserve list.
 * @returns Manifest entry for supported assets, or undefined for skipped files.
 * @example
 * const result = await processAssetFile('public/icon.png', { sourceDir: 'public', outputDir: 'public', preserveSvgPaths: new Set() });
 */
const processAssetFile = async (
  filePath: string,
  options: ProcessAssetOptions,
): Promise<ProcessAssetResult | undefined> => {
  const rel = relative(options.sourceDir, filePath);
  const outPath = join(options.outputDir, rel);
  const extension = extname(filePath).toLowerCase();

  if (extension === SVG_EXT) {
    if (!options.preserveSvgPaths.has(rel)) {
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
    relVariants[key] = relative(options.outputDir, path);
  }
  const optimized = variants.webp === undefined ? rel : relative(options.outputDir, variants.webp);

  return {
    rel,
    entry: {
      source: rel,
      optimized,
      variants: relVariants,
    },
  };
};

/**
 * Scan a directory, compress rasters (WebP + AVIF at perceptual defaults) and SVGs (SVGO),
 * and write an {@link AssetManifest} mapping sources to optimized variants.
 *
 * @param options - Source directory, optional output directory, manifest name, and SVG preserve list.
 * @returns Manifest metadata plus the number of processed source assets.
 * @example
 * const result = await runOptimizeForBuild({ sourceDir: 'public', preserveSvgPaths: ['icon.svg'] });
 */
const runOptimizeForBuild = async (options: OptimizeBuildOptions): Promise<OptimizeBuildResult> => {
  const normalized = normalizeOptimizeOptions(options);
  const { outputDir, manifestName, preserveSvgPaths } = normalized;
  const manifestPath = join(outputDir, manifestName);
  const manifest: AssetManifest = { files: {} };

  if (!(await directoryExists(options.sourceDir))) {
    await writeAssetManifest(manifestPath, manifest);
    return { manifest, manifestPath, processedCount: 0 };
  }

  const allFiles = await walkFiles(options.sourceDir);
  const canonicalRasterFiles = selectCanonicalRasterFiles(allFiles);
  const inputFiles = allFiles.filter(
    (filePath) => !isRaster(filePath) || canonicalRasterFiles.has(filePath),
  );
  const entries = await Promise.all(
    inputFiles.map((filePath) =>
      processAssetFile(filePath, { sourceDir: options.sourceDir, outputDir, preserveSvgPaths }),
    ),
  );
  let processedCount = 0;

  for (const result of entries) {
    if (result !== undefined) {
      manifest.files[result.rel] = result.entry;
      processedCount += 1;
    }
  }

  await writeAssetManifest(manifestPath, manifest);

  return { manifest, manifestPath, processedCount };
};

/**
 * Check whether a directory can be read.
 *
 * @param path - Directory path to inspect.
 * @returns True when the directory exists and is readable.
 * @example
 * const exists = await directoryExists('public');
 */
const directoryExists = async (path: string): Promise<boolean> => {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
};

export { runOptimizeForBuild };
