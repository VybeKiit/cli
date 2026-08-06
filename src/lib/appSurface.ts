import { join, resolve } from 'node:path';
import { pathExists } from './pathExists';

/**
 * Strip leading `/` characters from a route path.
 * `/cart` → `cart`, `//admin/users` → `admin/users`.
 *
 * @param route - Raw target route (may start with slashes).
 * @returns Route without a leading slash.
 */
const stripLeadingSlashes = (route: string): string => {
  let result = route;
  while (result.startsWith('/')) {
    result = result.slice(1);
  }
  return result;
};

/**
 * Strip trailing `/` characters from a route path.
 * `cart/` → `cart`, `admin/users//` → `admin/users`.
 *
 * @param route - Route body (may end with slashes).
 * @returns Route without a trailing slash.
 */
const stripTrailingSlashes = (route: string): string => {
  let result = route;
  while (result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
};

/** Detected buyer app layout under a destination path. */
export type AppSurfaceLayout = {
  /** Absolute app root (package with `app/` or `src/`). */
  readonly appRoot: string;
  /** Directory that holds Next.js `app/` routes, when present. */
  readonly appDir: string | undefined;
  /** Whether routes live under `app/[locale]/…`. */
  readonly usesLocaleSegment: boolean;
  /** Directory for React components (`src/components` preferred). */
  readonly componentsDir: string;
};

/**
 * Rank candidate app roots under a destination (kit workspace or bare app).
 *
 * @param dest - User-provided destination directory.
 * @returns Ordered absolute candidates to probe.
 * @example
 * const candidates = appRootCandidates('/tmp/kit');
 */
const appRootCandidates = (dest: string): readonly string[] => {
  const root = resolve(dest);
  return [
    root,
    join(root, 'templates', 'web'),
    join(root, 'web'),
    join(root, 'templates', 'spa'),
    join(root, 'spa'),
    join(root, 'apps', 'web'),
  ];
};

/**
 * Build the default layout when no package/app structure is found.
 *
 * @param dest - Destination directory.
 * @returns Layout treating dest as the app root.
 * @example
 * const layout = defaultAppSurfaceLayout('/tmp/fresh');
 */
const defaultAppSurfaceLayout = (dest: string): AppSurfaceLayout => {
  const root = resolve(dest);
  return {
    appRoot: root,
    appDir: undefined,
    usesLocaleSegment: false,
    componentsDir: join(root, 'src', 'components', 'pageRecipes'),
  };
};

/**
 * Probe one candidate root for an installable app surface.
 *
 * @param candidate - Absolute path to check.
 * @returns Layout when the path looks like an app, otherwise undefined.
 * @example
 * const layout = await probeAppRoot('/tmp/my-app');
 */
const probeAppRoot = async (candidate: string): Promise<AppSurfaceLayout | undefined> => {
  const appAtRoot = join(candidate, 'app');
  const appUnderSrc = join(candidate, 'src', 'app');
  const srcDir = join(candidate, 'src');
  const [hasPackage, hasAppAtRoot, hasAppUnderSrc, hasSrc] = await Promise.all([
    pathExists(join(candidate, 'package.json')),
    pathExists(appAtRoot),
    pathExists(appUnderSrc),
    pathExists(srcDir),
  ]);

  if (!(hasPackage || hasAppAtRoot || hasAppUnderSrc || hasSrc)) {
    return;
  }

  let appDir: string | undefined;
  if (hasAppAtRoot) {
    appDir = appAtRoot;
  } else if (hasAppUnderSrc) {
    appDir = appUnderSrc;
  }

  const usesLocaleSegment = appDir !== undefined && (await pathExists(join(appDir, '[locale]')));

  const componentsDir = hasSrc
    ? join(candidate, 'src', 'components', 'pageRecipes')
    : join(candidate, 'components', 'pageRecipes');

  return {
    appRoot: candidate,
    appDir,
    usesLocaleSegment,
    componentsDir,
  };
};

/**
 * Resolve where page-recipe files should land under a destination path.
 *
 * Prefers an existing Next.js (or SPA) app under the destination or common kit
 * layouts (`templates/web`, `web/`). Falls back to treating the destination as
 * the app root so agents can install into a fresh folder.
 *
 * @param dest - Destination directory from `--to` or cwd.
 * @returns Layout paths for components and optional routes.
 * @example
 * const layout = await selectedAppSurface('/tmp/my-app');
 */
export const selectedAppSurface = async (dest: string): Promise<AppSurfaceLayout> => {
  const probes = await Promise.all(appRootCandidates(dest).map(probeAppRoot));
  const hit = probes.find((layout) => layout !== undefined);
  if (hit !== undefined) {
    return hit;
  }
  return defaultAppSurfaceLayout(dest);
};

/**
 * Map a recipe `targetRoute` (e.g. `/cart`) to a filesystem route segment path
 * relative to the app's `app/` directory.
 *
 * @param targetRoute - Manifest route such as `/cart` or `/admin/users`.
 * @param usesLocaleSegment - Whether to prefix with `[locale]`.
 * @returns Relative path like `cart` or `[locale]/cart`.
 * @example
 * const segment = routeSegmentPath('/cart', true);
 */
export const routeSegmentPath = (targetRoute: string, usesLocaleSegment: boolean): string => {
  const trimmed = stripTrailingSlashes(stripLeadingSlashes(targetRoute));
  const body = trimmed === '' ? 'index' : trimmed;
  // Next.js optional locale folder name is the literal segment `[locale]`, not an array index.
  if (usesLocaleSegment) {
    return join('[locale]', body);
  }
  return body;
};
