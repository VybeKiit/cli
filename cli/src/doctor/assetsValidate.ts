import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectSurface } from '../lib/inferProjectSurface';
import { inferProjectSurfaceSync } from '../lib/inferProjectSurface';
import type { TemplateName } from '../lib/scaffold';

/** Report for hybrid asset pipeline validation (ADR-0010 / ADR-0038 §8.1). */
export type AssetsValidateReport = {
  /** True when not a kit project, or the surface pipeline is wired. Warn-only gaps stay true. */
  readonly ok: boolean;
  readonly lines: readonly string[];
  /** skipped = pre-create / non-kit cwd; ok = wired; warn = kit present but incomplete. */
  readonly status: 'skipped' | 'ok' | 'warn';
};

/** Injectable filesystem probe for unit tests. */
export type AssetsValidateDeps = {
  readonly exists: (relativePath: string) => boolean;
  readonly readUtf8: (relativePath: string) => string | null;
};

type PackageJsonSlice = {
  readonly dependencies?: Partial<Record<string, string>>;
  readonly devDependencies?: Partial<Record<string, string>>;
  readonly scripts?: Partial<Record<string, string>>;
};

/** Surfaces that ship static project images through build-time optimize. */
const ASSET_SURFACE_DIRS: Readonly<Partial<Record<TemplateName, string>>> = {
  web: 'public',
  spa: 'public',
  extension: 'public',
  mobile: 'assets',
};

const OPTIMIZE_SCRIPT_MARKERS = [
  'optimizeAssets',
  'optimize-assets',
  'scripts/optimizeAssets',
  'scripts/optimize.mts',
  'scripts/optimize.ts',
] as const;

const OPTIMIZE_FILE_CANDIDATES = [
  'scripts/optimizeAssets.ts',
  'scripts/optimizeAssets.mts',
  'scripts/optimize.mts',
  'scripts/optimize.ts',
] as const;

/**
 * Create the default filesystem-backed probe for assets validation.
 *
 * @param cwd - Project directory to inspect.
 * @returns Deps used by doctor in production.
 * @example
 * const deps = createDefaultAssetsValidateDeps(process.cwd());
 */
export const createDefaultAssetsValidateDeps = (cwd: string): AssetsValidateDeps => ({
  exists: (relativePath) => existsSync(join(cwd, relativePath)),
  readUtf8: (relativePath) => {
    const absolute = join(cwd, relativePath);
    if (!existsSync(absolute)) {
      return null;
    }
    try {
      return readFileSync(absolute, 'utf8');
    } catch {
      return null;
    }
  },
});

/**
 * Parse package.json fields used for assets validation.
 *
 * @param deps - Injectable filesystem probe.
 * @returns Parsed package slice, or null when missing/unreadable.
 * @example
 * const pkg = readPackageJsonSlice(createDefaultAssetsValidateDeps(process.cwd()));
 */
const readPackageJsonSlice = (deps: AssetsValidateDeps): PackageJsonSlice | null => {
  const raw = deps.readUtf8('package.json');
  if (raw === null || raw === '') {
    return null;
  }
  try {
    return JSON.parse(raw) as PackageJsonSlice;
  } catch {
    return null;
  }
};

/**
 * Detect whether package.json declares any `@vybekiit/*` dependency.
 *
 * @param pkg - Parsed package.json slice.
 * @returns True when a kit workspace package is listed.
 * @example
 * const kit = hasVybekiitDependency({ dependencies: { '@vybekiit/core': 'workspace:*' } });
 */
const hasVybekiitDependency = (pkg: PackageJsonSlice): boolean => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.keys(deps).some((name) => name.startsWith('@vybekiit/'));
};

/**
 * Detect whether the cwd looks like a kit project (buyer app or template).
 *
 * @param deps - Injectable filesystem probe.
 * @returns True when platform skills or `@vybekiit/*` deps are present.
 * @example
 * const kit = isKitProject(createDefaultAssetsValidateDeps(process.cwd()));
 */
export const isKitProject = (deps: AssetsValidateDeps): boolean => {
  if (deps.exists('platform-skills.manifest.json')) {
    return true;
  }
  const pkg = readPackageJsonSlice(deps);
  return pkg !== null && hasVybekiitDependency(pkg);
};

/**
 * Check whether package.json lists `@vybekiit/assets`.
 *
 * @param pkg - Parsed package.json slice.
 * @returns True when the assets package is a declared dependency.
 * @example
 * const has = hasAssetsPackage({ dependencies: { '@vybekiit/assets': 'workspace:*' } });
 */
const hasAssetsPackage = (pkg: PackageJsonSlice): boolean => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return deps['@vybekiit/assets'] !== undefined;
};

/**
 * Check whether package scripts reference the optimize entry.
 *
 * @param pkg - Parsed package.json slice.
 * @returns True when a script value mentions optimize-assets wiring.
 * @example
 * const wired = hasOptimizeScript({ scripts: { prebuild: 'tsx scripts/optimizeAssets.ts' } });
 */
const hasOptimizeScript = (pkg: PackageJsonSlice): boolean => {
  const { scripts } = pkg;
  if (scripts === undefined) {
    return false;
  }
  return Object.values(scripts).some((value) => {
    if (value === undefined || value === '') {
      return false;
    }
    return OPTIMIZE_SCRIPT_MARKERS.some((marker) => value.includes(marker));
  });
};

/**
 * Check whether a known optimize script file exists on disk.
 *
 * @param deps - Injectable filesystem probe.
 * @returns True when an optimizeAssets / optimize script file is present.
 * @example
 * const present = hasOptimizeScriptFile(createDefaultAssetsValidateDeps(process.cwd()));
 */
const hasOptimizeScriptFile = (deps: AssetsValidateDeps): boolean =>
  OPTIMIZE_FILE_CANDIDATES.some((relativePath) => deps.exists(relativePath));

/**
 * Resolve the surface-specific static asset directory for build-time optimize.
 *
 * @param template - Inferred project template.
 * @returns Relative asset dir, or null when the surface does not ship a static dir.
 * @example
 * const dir = assetDirForTemplate('web'); // "public"
 */
export const assetDirForTemplate = (template: TemplateName): string | null =>
  ASSET_SURFACE_DIRS[template] ?? null;

/**
 * Build buyer-readable lines for a fully wired assets pipeline.
 *
 * @param template - Inferred project template.
 * @param assetDir - Surface asset directory name.
 * @returns Success report lines (including extension no-CDN note).
 * @example
 * const lines = okLines('extension', 'public');
 */
const okLines = (template: TemplateName, assetDir: string | null): string[] => {
  if (template === 'extension') {
    return [
      '✓ pictures pipeline - packed extension images optimize at build (no CDN for chrome-extension:// assets).',
    ];
  }
  if (template === 'mobile') {
    return [
      `✓ pictures pipeline - app images under ${assetDir ?? 'assets'}/ optimize on build/start (WebP-ready).`,
    ];
  }
  if (template === 'backend') {
    return [
      '✓ pictures pipeline - @vybekiit/assets is available for upload delivery URLs (no static public/ ship path).',
    ];
  }
  return [
    `✓ pictures pipeline - project images under ${assetDir ?? 'public'}/ go through optimize + fast delivery.`,
  ];
};

/**
 * One plain fix when the assets pipeline is incomplete for this surface.
 *
 * @param template - Inferred project template.
 * @param hasPackage - Whether `@vybekiit/assets` is declared.
 * @param hasOptimize - Whether an optimize hook/script is present.
 * @param assetDir - Expected static dir, or null.
 * @param hasAssetDir - Whether the expected static dir exists.
 * @returns Single remediation line for the agent.
 * @example
 * const line = warnLine({ template: 'web', hasPackage: false, hasOptimize: false, assetDir: 'public', hasAssetDir: true });
 */
const warnLine = (input: {
  readonly template: TemplateName;
  readonly hasPackage: boolean;
  readonly hasOptimize: boolean;
  readonly assetDir: string | null;
  readonly hasAssetDir: boolean;
}): string => {
  const { assetDir, hasAssetDir, hasOptimize, hasPackage, template } = input;
  if (!(hasPackage || hasOptimize)) {
    return '→ pictures pipeline - add @vybekiit/assets and a prebuild/prestart optimize script so project images stay fast.';
  }
  if (!hasPackage) {
    return '→ pictures pipeline - add @vybekiit/assets to package.json so optimize + delivery share one path.';
  }
  if (!hasOptimize && template !== 'backend') {
    return '→ pictures pipeline - wire scripts/optimizeAssets into prebuild (or prestart) so images compress before ship.';
  }
  if (assetDir !== null && !hasAssetDir) {
    return `→ pictures pipeline - create ${assetDir}/ for project images (or restore the template asset folder).`;
  }
  return '→ pictures pipeline - refresh from update-kit so optimize + delivery hooks match the kit.';
};

/**
 * Validate that a kit project keeps the hybrid assets path (ADR-0010).
 * Pre-create / non-kit directories skip silently so doctor stays green.
 *
 * @param cwd - Project directory to inspect.
 * @param surface - Optional precomputed surface; inferred when omitted.
 * @param deps - Optional injectable filesystem probe.
 * @returns Assets validation report with plain-language lines.
 * @example
 * const report = verifyAssetsPipeline(process.cwd());
 */
export const verifyAssetsPipeline = (
  cwd: string,
  surface: ProjectSurface = inferProjectSurfaceSync(cwd),
  deps: AssetsValidateDeps = createDefaultAssetsValidateDeps(cwd),
): AssetsValidateReport => {
  if (!isKitProject(deps)) {
    return { ok: true, lines: [], status: 'skipped' };
  }

  const pkg = readPackageJsonSlice(deps);
  const hasPackage = pkg !== null && hasAssetsPackage(pkg);
  const hasOptimize = (pkg !== null && hasOptimizeScript(pkg)) || hasOptimizeScriptFile(deps);
  const assetDir = assetDirForTemplate(surface.template);
  const hasAssetDir = assetDir === null ? true : deps.exists(assetDir);

  // Backend: package presence is enough (upload URL delivery; no static ship dir).
  if (surface.template === 'backend') {
    if (hasPackage) {
      return { ok: true, lines: okLines('backend', null), status: 'ok' };
    }
    return {
      ok: true,
      lines: [
        warnLine({
          template: 'backend',
          hasPackage: false,
          hasOptimize: false,
          assetDir: null,
          hasAssetDir: true,
        }),
      ],
      status: 'warn',
    };
  }

  const fullyWired = hasPackage && hasOptimize && hasAssetDir;
  if (fullyWired) {
    return {
      ok: true,
      lines: okLines(surface.template, assetDir),
      status: 'ok',
    };
  }

  // Partial package-only (e.g. spa scaffold) or missing hooks → advisory warn, doctor stays green.
  return {
    ok: true,
    lines: [
      warnLine({
        template: surface.template,
        hasPackage,
        hasOptimize,
        assetDir,
        hasAssetDir,
      }),
    ],
    status: 'warn',
  };
};
