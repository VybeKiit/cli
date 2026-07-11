/**
 * Process ChatGPT 3D logo PNGs → transparent WebP + hero stack manifest.
 * tier '3d': writes public/brand-marks-3d/{slug}.webp
 * tier 'reuse2d': manifest points at existing public/brand-marks/{slug}.webp (no copy)
 *
 * Run: pnpm --filter vybekiit-landing process-3d-marks
 */
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.join(__dirname, '..');
const homeDir = process.env.HOME;
const downloadsDir = path.join(homeDir === undefined ? '' : homeDir, 'Downloads');
const outDir = path.join(landingRoot, 'public/brand-marks-3d');
const manifestPath = path.join(landingRoot, 'src/data/brandMarks3d.ts');
const flatMarksDir = path.join(landingRoot, 'public/brand-marks');

/** Mirrors LogoMarkIcon LOGO_MARK_RASTERS for reuse2d slugs. */
const FLAT_MARK_SRC = {
  react: '/brand-marks/react.webp',
  lemonsqueezy: '/brand-marks/lemonsqueezy.webp',
  betterauth: '/brand-marks/betterauth.webp',
  sonner: '/brand-marks/sonner.webp',
  plausible: '/brand-marks/plausible.webp',
  googlechrome: '/brand-marks/googlechrome.webp',
  appstore: '/brand-marks/appstore.webp',
  googleplay: '/brand-marks/googleplay.webp',
  githubcopilot: '/brand-marks/githubcopilot.webp',
  windsurf: '/brand-marks/windsurf.webp',
  cline: '/brand-marks/cline.webp',
  kiro: '/brand-marks/kiro.webp',
  googlegemini: '/brand-marks/googlegemini.webp',
  continue: '/brand-marks/continue.webp',
  jetbrains: '/brand-marks/jetbrains.webp',
  aider: '/brand-marks/aider.webp',
  augment: '/brand-marks/augment.webp',
  roo: '/brand-marks/roo.webp',
  trae: '/brand-marks/trae.webp',
  antigravity: '/brand-marks/antigravity.webp',
  replit: '/brand-marks/replit.webp',
  devin: '/brand-marks/devin.webp',
  opencode: '/brand-marks/opencode.webp',
  zed: '/brand-marks/zed.webp',
  amazonq: '/brand-marks/amazonq.webp',
};

/**
 * slug → tier + optional 3d source (best ~45° single-angle ChatGPT PNG).
 * reuse2d slugs use clean official flat WebPs in the hero — never reprocessed.
 */
const SLUG_SOURCES = {
  nextdotjs: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_31 AM (1).png' },
  tailwindcss: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_25 AM (1).png' },
  typescript: {
    tier: '3d',
    file: 'ChatGPT Image Jun 30, 2026, 11_34_41 AM.png',
    crop: { left: 0, top: 0, width: 0.5, height: 0.5 },
  },
  react: { tier: 'reuse2d' },
  shadcn: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_35 AM (2).png' },
  supabase: {
    tier: '3d',
    file: 'ChatGPT Image Jun 30, 2026, 11_34_35 AM.png',
    crop: { left: 0, top: 0, width: 0.5, height: 0.5 },
  },
  cloudflare: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_19 AM (1).png' },
  lemonsqueezy: { tier: 'reuse2d' },
  betterauth: { tier: 'reuse2d' },
  openai: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_26_11 AM (1).png' },
  expo: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_16 AM (1).png' },
  wxt: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_35 AM (1).png' },
  sonner: { tier: 'reuse2d' },
  resend: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_35_03 AM (3).png' },
  stripe: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_34_57 AM.png' },
  paypal: {
    tier: '3d',
    file: 'ChatGPT Image Jun 30, 2026, 11_25_54 AM.png',
    crop: { left: 0, top: 0, width: 0.5, height: 0.5 },
  },
  vercel: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_34_51 AM.png' },
  amazonaws: {
    tier: '3d',
    file: 'ChatGPT Image Jun 30, 2026, 11_26_00 AM.png',
    crop: { left: 0, top: 0, width: 0.5, height: 0.5 },
  },
  mongodb: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_34_47 AM (1).png' },
  google: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_34_43 AM (1).png' },
  sentry: { tier: '3d', file: 'ChatGPT Image Jun 30, 2026, 11_34_31 AM (2).png' },
  plausible: { tier: 'reuse2d' },
  googlechrome: { tier: 'reuse2d' },
  appstore: { tier: 'reuse2d' },
  googleplay: { tier: 'reuse2d' },
  // AI Agent runtimes (flat 2d marks)
  githubcopilot: { tier: 'reuse2d' },
  windsurf: { tier: 'reuse2d' },
  cline: { tier: 'reuse2d' },
  kiro: { tier: 'reuse2d' },
  googlegemini: { tier: 'reuse2d' },
  continue: { tier: 'reuse2d' },
  jetbrains: { tier: 'reuse2d' },
  aider: { tier: 'reuse2d' },
  augment: { tier: 'reuse2d' },
  roo: { tier: 'reuse2d' },
  trae: { tier: 'reuse2d' },
  antigravity: { tier: 'reuse2d' },
  replit: { tier: 'reuse2d' },
  devin: { tier: 'reuse2d' },
  opencode: { tier: 'reuse2d' },
  zed: { tier: 'reuse2d' },
  amazonq: { tier: 'reuse2d' },
};

const PRODUCT_STACK_SLUGS = Object.keys(SLUG_SOURCES);

/** Outer ring positions — distributed scale for 42 marks. */
const ORBIT_POSITIONS = [
  { x: 0.04, y: 0.06, scale: 0.28, floatPhase: 0 },
  { x: 0.96, y: 0.08, scale: 0.26, floatPhase: 0.8 },
  { x: 0.1, y: 0.28, scale: 0.24, floatPhase: 1.6 },
  { x: 0.9, y: 0.26, scale: 0.26, floatPhase: 2.4 },
  { x: 0.02, y: 0.48, scale: 0.22, floatPhase: 3.2 },
  { x: 0.98, y: 0.46, scale: 0.24, floatPhase: 4.0 },
  { x: 0.06, y: 0.7, scale: 0.24, floatPhase: 4.8 },
  { x: 0.94, y: 0.68, scale: 0.26, floatPhase: 5.6 },
  { x: 0.18, y: 0.12, scale: 0.22, floatPhase: 0.4 },
  { x: 0.82, y: 0.1, scale: 0.22, floatPhase: 1.2 },
  { x: 0.22, y: 0.4, scale: 0.2, floatPhase: 2.0 },
  { x: 0.78, y: 0.38, scale: 0.22, floatPhase: 2.8 },
  { x: 0.16, y: 0.56, scale: 0.22, floatPhase: 3.6 },
  { x: 0.84, y: 0.54, scale: 0.2, floatPhase: 4.4 },
  { x: 0.12, y: 0.82, scale: 0.22, floatPhase: 5.2 },
  { x: 0.88, y: 0.8, scale: 0.24, floatPhase: 6.0 },
  { x: 0.3, y: 0.18, scale: 0.18, floatPhase: 0.6 },
  { x: 0.7, y: 0.16, scale: 0.2, floatPhase: 1.4 },
  { x: 0.34, y: 0.58, scale: 0.18, floatPhase: 2.2 },
  { x: 0.66, y: 0.56, scale: 0.2, floatPhase: 3.0 },
  { x: 0.28, y: 0.74, scale: 0.18, floatPhase: 3.8 },
  { x: 0.72, y: 0.72, scale: 0.2, floatPhase: 4.6 },
  { x: 0.5, y: 0.08, scale: 0.18, floatPhase: 5.4 },
  { x: 0.48, y: 0.9, scale: 0.2, floatPhase: 6.2 },
  { x: 0.5, y: 0.48, scale: 0.16, floatPhase: 1.0 },
  // AI Agent runtime positions (inner + fill)
  { x: 0.38, y: 0.24, scale: 0.16, floatPhase: 0.3 },
  { x: 0.62, y: 0.22, scale: 0.16, floatPhase: 1.1 },
  { x: 0.42, y: 0.42, scale: 0.14, floatPhase: 1.9 },
  { x: 0.58, y: 0.4, scale: 0.14, floatPhase: 2.7 },
  { x: 0.44, y: 0.64, scale: 0.16, floatPhase: 3.5 },
  { x: 0.56, y: 0.62, scale: 0.16, floatPhase: 4.3 },
  { x: 0.36, y: 0.8, scale: 0.16, floatPhase: 5.1 },
  { x: 0.64, y: 0.82, scale: 0.16, floatPhase: 5.9 },
  { x: 0.24, y: 0.9, scale: 0.18, floatPhase: 0.7 },
  { x: 0.76, y: 0.88, scale: 0.18, floatPhase: 1.5 },
  { x: 0.08, y: 0.92, scale: 0.18, floatPhase: 2.3 },
  { x: 0.92, y: 0.9, scale: 0.18, floatPhase: 3.1 },
  { x: 0.4, y: 0.04, scale: 0.16, floatPhase: 3.9 },
  { x: 0.6, y: 0.04, scale: 0.16, floatPhase: 4.7 },
  { x: 0.26, y: 0.52, scale: 0.16, floatPhase: 5.5 },
  { x: 0.74, y: 0.5, scale: 0.16, floatPhase: 6.3 },
  { x: 0.5, y: 0.76, scale: 0.16, floatPhase: 0.2 },
];

const load3dSourceBuffer = async (source) => {
  const primary = path.join(downloadsDir, source.file);
  let pipeline = sharp(primary);
  if (source.crop) {
    const meta = await sharp(primary).metadata();
    const w = meta.width === undefined ? 1 : meta.width;
    const h = meta.height === undefined ? 1 : meta.height;
    const { left, top, width, height } = source.crop;
    pipeline = pipeline.extract({
      left: Math.round(left * w),
      top: Math.round(top * h),
      width: Math.round(width * w),
      height: Math.round(height * h),
    });
  }
  return pipeline.toBuffer();
};

const erodeAlpha = (pixels, width, height, channels = 4) => {
  const copy = Buffer.from(pixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * channels;
      if (pixels[i + 3] !== 0) {
        let neighborTransparent = false;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const ni = ((y + dy) * width + (x + dx)) * channels;
          if (pixels[ni + 3] < 128) neighborTransparent = true;
        }
        if (neighborTransparent) copy[i + 3] = Math.min(copy[i + 3], 200);
      }
    }
  }
  return copy;
};

const removeWhiteBackground = async (input) => {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  const { width, height } = info;
  const shadowStartY = Math.floor(height * 0.88);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const lightness = (r + g + b) / 3;
      const saturation = max - min;

      if (y >= shadowStartY && lightness > 180 && saturation < 40) {
        pixels[i + 3] = 0;
      } else if (lightness > 240 && saturation < 25) {
        pixels[i + 3] = 0;
      } else if (lightness > 220 && saturation < 18) {
        pixels[i + 3] = Math.min(pixels[i + 3], 64);
      }
    }
  }

  const eroded = erodeAlpha(pixels, width, height);

  let pipeline = sharp(eroded, {
    raw: { width, height, channels: 4 },
  });

  try {
    pipeline = pipeline.trim({ threshold: 15 });
  } catch {
    // keep untrimmed if trim fails
  }

  return pipeline.png().toBuffer();
};

const write3dWebp = async (slug, input) => {
  const cutout = await removeWhiteBackground(input);
  const webp = await sharp(cutout)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toBuffer();
  await writeFile(path.join(outDir, `${slug}.webp`), webp);
};

const removeStale3d = async (slug) => {
  try {
    await unlink(path.join(outDir, `${slug}.webp`));
  } catch {
    // already absent
  }
};

const generateManifest = (entries) => {
  const lines = entries.map((e) => {
    const fields = [
      `slug: '${e.slug}'`,
      `src: '${e.src}'`,
      `tier: '${e.tier}'`,
      `x: ${e.x}`,
      `y: ${e.y}`,
      `scale: ${e.scale}`,
      `floatPhase: ${e.floatPhase}`,
    ];
    return `  {\n    ${fields.join(',\n    ')},\n  },`;
  });

  return `/** Auto-generated by scripts/processBrandMarks3d.mjs — do not edit manually. */

export interface HeroStackMarkEntry {
  readonly slug: string;
  readonly src: string;
  readonly tier: '3d' | '2d';
  /** Normalized horizontal position in hero (0–1). */
  readonly x: number;
  /** Normalized vertical position in hero (0–1). */
  readonly y: number;
  readonly scale: number;
  readonly floatPhase: number;
}

export const HERO_STACK_MARKS: readonly HeroStackMarkEntry[] = [
${lines.join('\n')}
];
`;
};

const logInfo = (message) => {
  process.stdout.write(`${message}\n`);
};

const logWarn = (message) => {
  process.stderr.write(`${message}\n`);
};

const logError = (message) => {
  process.stderr.write(`${message}\n`);
};

const errorMessage = (error) => (error instanceof Error ? error.message : String(error));

const main = async () => {
  await mkdir(outDir, { recursive: true });

  const manifestEntries = [];
  const processed3d = [];
  const reused2d = [];
  const errors = [];

  for (const [index, slug] of PRODUCT_STACK_SLUGS.entries()) {
    const source = SLUG_SOURCES[slug];
    const pos = ORBIT_POSITIONS[index % ORBIT_POSITIONS.length];

    if (source.tier === 'reuse2d') {
      const flatSrc = FLAT_MARK_SRC[slug];
      const src = flatSrc === undefined ? `/brand-marks/${slug}.webp` : flatSrc;
      await removeStale3d(slug);
      manifestEntries.push({ slug, src, tier: '2d', ...pos });
      reused2d.push(slug);
      logInfo(`↪ ${slug} → ${src} (reuse2d)`);
    } else {
      try {
        const input = await load3dSourceBuffer(source);
        await write3dWebp(slug, input);
        manifestEntries.push({
          slug,
          src: `/brand-marks-3d/${slug}.webp`,
          tier: '3d',
          ...pos,
        });
        processed3d.push(slug);
        logInfo(`✓ ${slug}.webp`);
      } catch (error) {
        errors.push(slug);
        const flatSrc = FLAT_MARK_SRC[slug];
        const fallbackSrc = flatSrc === undefined ? `/brand-marks/${slug}.webp` : flatSrc;
        await removeStale3d(slug);
        manifestEntries.push({ slug, src: fallbackSrc, tier: '2d', ...pos });
        logWarn(`✗ ${slug} 3d failed (${errorMessage(error)}) → ${fallbackSrc}`);
      }
    }
  }

  await writeFile(manifestPath, generateManifest(manifestEntries));

  const downloadFiles = await readdir(downloadsDir).catch(() => []);
  const chatgptCount = downloadFiles.filter((f) => f.startsWith('ChatGPT Image Jun 30')).length;

  logInfo(
    `\n3D processed: ${processed3d.length} | 2D reused: ${reused2d.length} | errors: ${errors.length}`,
  );
  logInfo(`Manifest: ${manifestPath}`);
  logInfo(`(${chatgptCount} ChatGPT sources in Downloads)`);
};

main().catch((error) => {
  logError(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
