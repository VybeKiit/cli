import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';

// Build-time only (tsx-run, excluded from the app typecheck): keeps sharp/svgo/node:fs off the
// React Native bundle. Types are inlined so this stays self-contained under `scripts/`.
interface OptimizeBuildOptions {
  readonly sourceDir: string;
  readonly outputDir?: string;
  readonly manifestName?: string;
}

interface AssetManifestEntry {
  readonly source: string;
  readonly optimized: string;
  readonly variants: Record<string, string>;
}

interface AssetManifest {
  readonly files: Record<string, AssetManifestEntry>;
}

interface OptimizeBuildResult {
  readonly manifest: AssetManifest;
  readonly manifestPath: string;
  readonly processedCount: number;
}

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.tiff']);
const SVG_EXT = '.svg';
const MAX_WIDTH = 1920;
const QUALITY = 80;

async function walkFiles(dir: string): Promise<string[]> {
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
}

function isRaster(path: string): boolean {
  return RASTER_EXT.has(extname(path).toLowerCase());
}

async function optimizeRaster(
  sourcePath: string,
  outputPath: string,
): Promise<Record<string, string>> {
  const image = sharp(sourcePath);
  const meta = await image.metadata();
  const width = meta.width ?? MAX_WIDTH;
  const resizeWidth = width > MAX_WIDTH ? MAX_WIDTH : undefined;

  // swap the trailing file extension: "img.png" → "img.webp" / "img.avif"
  const webpPath = outputPath.replace(/\.[^.]+$/, '.webp');
  const avifPath = outputPath.replace(/\.[^.]+$/, '.avif');
  const variants: Record<string, string> = {};

  if (webpPath !== sourcePath) {
    await sharp(sourcePath)
      .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    variants.webp = webpPath;
  }

  if (avifPath !== sourcePath) {
    await sharp(sourcePath)
      .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
      .avif({ quality: QUALITY })
      .toFile(avifPath);
    variants.avif = avifPath;
  }

  if (extname(sourcePath).toLowerCase() === '.png' && meta.hasAlpha) {
    const pngPath = outputPath.endsWith('.png') ? outputPath : `${outputPath}.png`;
    if (pngPath !== sourcePath) {
      await sharp(sourcePath)
        .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(pngPath);
    }
    variants.png = pngPath;
    return variants;
  }

  return variants;
}

async function optimizeSvgFile(sourcePath: string, outputPath: string): Promise<void> {
  const input = await readFile(sourcePath, 'utf8');
  const result = optimizeSvg(input, { multipass: true, plugins: ['preset-default'] });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.data);
}

/**
 * Scan a directory, compress rasters (WebP + AVIF at perceptual defaults) and SVGs (SVGO),
 * and write an {@link AssetManifest} mapping sources to optimized variants.
 */
export async function runOptimizeForBuild(
  options: OptimizeBuildOptions,
): Promise<OptimizeBuildResult> {
  const outputDir = options.outputDir ?? options.sourceDir;
  const manifestName = options.manifestName ?? 'asset-manifest.json';
  const manifestPath = join(outputDir, manifestName);
  const manifest: AssetManifest = { files: {} };

  let processedCount = 0;

  if (!(await directoryExists(options.sourceDir))) {
    await mkdir(outputDir, { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return { manifest, manifestPath, processedCount };
  }

  const allFiles = await walkFiles(options.sourceDir);

  for (const filePath of allFiles) {
    const rel = relative(options.sourceDir, filePath);
    const outPath = join(outputDir, rel);

    if (extname(filePath).toLowerCase() === SVG_EXT) {
      await optimizeSvgFile(filePath, outPath);
      manifest.files[rel] = {
        source: rel,
        optimized: rel,
        variants: {},
      };
      processedCount += 1;
      continue;
    }

    if (!isRaster(filePath)) {
      continue;
    }

    await mkdir(dirname(outPath), { recursive: true });
    const variants = await optimizeRaster(filePath, outPath);
    const relVariants: Record<string, string> = {};
    for (const [key, path] of Object.entries(variants)) {
      relVariants[key] = relative(outputDir, path);
    }

    manifest.files[rel] = {
      source: rel,
      optimized: relVariants.webp ?? rel,
      variants: relVariants,
    };
    processedCount += 1;
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { manifest, manifestPath, processedCount };
}

async function directoryExists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}
