import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ScaffoldError } from './scaffold';

/** Loose package.json shape used while walking workspace:* dependencies. */
export type PackageJsonLike = {
  readonly name?: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly packageManager?: string;
};

// Split path segments on either separator: "packages\\tools/a" → ["packages","tools","a"].
const PATH_SEPARATOR_PATTERN = /[/\\]/;

/**
 * Read and parse a package.json, or null when missing/invalid.
 *
 * @param packageJsonPath - Absolute path to package.json.
 * @returns Parsed package object, or null.
 * @example
 * const pkg = await readPackageJson('/repo/packages/core/package.json');
 */
export const readPackageJson = async (packageJsonPath: string): Promise<PackageJsonLike | null> => {
  try {
    const raw = await readFile(packageJsonPath, 'utf8');
    return JSON.parse(raw) as PackageJsonLike;
  } catch {
    return null;
  }
};

/**
 * Collect `@vybekiit/*` dependency names that use `workspace:*` from one package.json.
 *
 * @param pkg - Parsed package.json.
 * @returns Unique workspace package names.
 * @example
 * listWorkspaceVybekiitDeps({ dependencies: { '@vybekiit/core': 'workspace:*' } });
 */
export const listWorkspaceVybekiitDeps = (pkg: PackageJsonLike): readonly string[] => {
  const sections = [
    pkg.dependencies,
    pkg.devDependencies,
    pkg.peerDependencies,
    pkg.optionalDependencies,
  ];
  const names = new Set<string>();
  for (const section of sections) {
    if (section !== undefined) {
      for (const [name, version] of Object.entries(section)) {
        if (name.startsWith('@vybekiit/') && version === 'workspace:*') {
          names.add(name);
        }
      }
    }
  }
  return [...names];
};

/**
 * Register one package directory into the name → path index when it is `@vybekiit/*`.
 *
 * @param dir - Absolute package directory.
 * @param index - Mutable index map.
 * @returns Promise that resolves after the index is updated.
 */
const registerPackageDir = async (dir: string, index: Map<string, string>): Promise<void> => {
  const pkg = await readPackageJson(join(dir, 'package.json'));
  if (pkg?.name?.startsWith('@vybekiit/') === true) {
    index.set(pkg.name, dir);
  }
};

/**
 * Index package name → directory under `packages/` (and one-level tools nests).
 *
 * @param packagesRoot - Absolute path to the kit's `packages/` directory.
 * @returns Map from `@vybekiit/*` name to absolute package directory.
 * @example
 * const index = await indexPackageDirs('/repo/packages');
 */
export const indexPackageDirs = async (packagesRoot: string): Promise<Map<string, string>> => {
  const index = new Map<string, string>();

  let topEntries: string[];
  try {
    topEntries = await readdir(packagesRoot);
  } catch (error) {
    throw new ScaffoldError(`Kit packages directory was not found at ${packagesRoot}.`, {
      cause: error,
    });
  }

  await Promise.all(
    topEntries.map(async (entry) => {
      const entryPath = join(packagesRoot, entry);
      const pkg = await readPackageJson(join(entryPath, 'package.json'));
      if (pkg?.name !== undefined) {
        await registerPackageDir(entryPath, index);
        return;
      }
      // Nested workspace lane e.g. packages/tools/* (no package.json on the tools folder itself).
      let nested: string[] = [];
      try {
        nested = await readdir(entryPath);
      } catch {
        nested = [];
      }
      await Promise.all(nested.map((child) => registerPackageDir(join(entryPath, child), index)));
    }),
  );

  return index;
};

/** Mutable BFS state for walking the workspace package graph. */
type VisitState = {
  readonly packageIndex: ReadonlyMap<string, string>;
  readonly surfaceLabel: string;
  readonly required: Set<string>;
  readonly queue: string[];
};

/**
 * Expand one workspace package into the required set and enqueue its workspace deps.
 *
 * @param name - `@vybekiit/*` package name to visit.
 * @param state - Shared BFS state for this graph walk.
 * @returns Promise that resolves after this package is recorded.
 */
const visitWorkspacePackage = async (name: string, state: VisitState): Promise<void> => {
  if (state.required.has(name)) {
    return;
  }
  const dir = state.packageIndex.get(name);
  if (dir === undefined) {
    throw new ScaffoldError(
      `Kit is missing workspace package ${name} required by the ${state.surfaceLabel} app.`,
    );
  }
  state.required.add(name);
  const nestedPkg = await readPackageJson(join(dir, 'package.json'));
  if (nestedPkg === null) {
    return;
  }
  for (const dep of listWorkspaceVybekiitDeps(nestedPkg)) {
    if (!state.required.has(dep)) {
      state.queue.push(dep);
    }
  }
};

/**
 * Walk the surface workspace graph and collect package directories to copy.
 *
 * @param surfacePackageJsonPath - Absolute path to the surface template's package.json.
 * @param packageIndex - Map of `@vybekiit/*` name → package directory.
 * @returns Absolute package directories to copy (stable order).
 * @example
 * const dirs = await collectRequiredPackageDirs('/kit/templates/web/package.json', index);
 */
export const collectRequiredPackageDirs = async (
  surfacePackageJsonPath: string,
  packageIndex: ReadonlyMap<string, string>,
): Promise<readonly string[]> => {
  const surfacePkg = await readPackageJson(surfacePackageJsonPath);
  if (surfacePkg === null) {
    throw new ScaffoldError(`Could not read surface package at ${surfacePackageJsonPath}.`);
  }

  const state: VisitState = {
    packageIndex,
    surfaceLabel: surfacePkg.name ?? 'surface',
    required: new Set<string>(),
    queue: [...listWorkspaceVybekiitDeps(surfacePkg)],
  };

  while (state.queue.length > 0) {
    const name = state.queue.pop();
    if (name !== undefined) {
      await visitWorkspacePackage(name, state);
    }
  }

  return [...state.required]
    .map((pkgName) => packageIndex.get(pkgName))
    .filter((dir): dir is string => dir !== undefined)
    .sort((a, b) => a.localeCompare(b));
};

/**
 * Relative path of a package dir under the kit's `packages/` root (preserves nested tools/).
 *
 * @param packagesRoot - Kit `packages/` absolute path.
 * @param packageDir - Absolute package directory.
 * @returns Relative segment like `core` or `tools/assistant-chat`.
 * @example
 * packageRelFromPackagesRoot('/repo/packages', '/repo/packages/core');
 */
export const packageRelFromPackagesRoot = (packagesRoot: string, packageDir: string): string => {
  const prefix = packagesRoot.endsWith('/') ? packagesRoot : `${packagesRoot}/`;
  if (packageDir.startsWith(prefix)) {
    return packageDir.slice(prefix.length);
  }
  // Windows-safe fallback when path separators differ from the prefix form.
  const parts = packageDir.split(PATH_SEPARATOR_PATTERN);
  const packagesIdx = parts.lastIndexOf('packages');
  if (packagesIdx >= 0 && packagesIdx < parts.length - 1) {
    return parts.slice(packagesIdx + 1).join('/');
  }
  return parts.at(-1) ?? packageDir;
};
