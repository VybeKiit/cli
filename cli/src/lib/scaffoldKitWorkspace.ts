import { access, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureAgentSkillSymlinks } from './agentSkillSymlinks';
import { shipFirstPartyMcpConfigs } from './firstPartyMcp';
import {
  collectRequiredPackageDirs,
  indexPackageDirs,
  type PackageJsonLike,
  packageRelFromPackagesRoot,
  readPackageJson,
} from './kitPackageGraph';
import { ScaffoldError, shouldCopyScaffoldPath, type TemplateName } from './scaffold';

/** Inputs for {@link scaffoldKitWorkspace}. */
export type ScaffoldKitOptions = {
  readonly template: TemplateName;
  /** Kit source root (monorepo or cloned kit) that holds `packages/` and `templates/`. */
  readonly kitRoot: string;
  /** Destination directory for the new kit workspace (must be empty or missing). */
  readonly dest: string;
};

/** Match `catalog:` block start in pnpm-workspace.yaml (line start). */
// input → "catalog:\n  effect: 3.21.4" matched from catalog:
const CATALOG_BLOCK_START = /^catalog:\s*$/m;

/**
 * Build buyer-facing root package.json for the kit workspace.
 *
 * @param kitRootPkg - Optional package.json from the kit source root.
 * @returns JSON string for the destination root package.json.
 */
const buildRootPackageJson = (kitRootPkg: PackageJsonLike | null): string => {
  const packageManager =
    kitRootPkg?.packageManager !== undefined && kitRootPkg.packageManager !== ''
      ? kitRootPkg.packageManager
      : 'pnpm@10.33.2';

  return `${JSON.stringify(
    {
      name: 'my-vybekiit-kit',
      private: true,
      packageManager,
    },
    null,
    2,
  )}\n`;
};

/**
 * Build buyer-facing pnpm-workspace.yaml listing packages + the chosen surface.
 *
 * @param template - Surface template id.
 * @param sourceWorkspaceYaml - Optional monorepo pnpm-workspace.yaml (for catalog: reuse).
 * @returns Workspace file contents.
 */
const buildPnpmWorkspaceYaml = (
  template: TemplateName,
  sourceWorkspaceYaml: string | null,
): string => {
  const lines = [
    'packages:',
    '  - "packages/*"',
    '  - "packages/tools/*"',
    `  - "templates/${template}"`,
    '',
  ];

  if (sourceWorkspaceYaml !== null) {
    const catalogMatch = CATALOG_BLOCK_START.exec(sourceWorkspaceYaml);
    if (catalogMatch !== null && catalogMatch.index !== undefined) {
      const catalogBlock = sourceWorkspaceYaml.slice(catalogMatch.index).trimEnd();
      lines.push(catalogBlock, '');
    }
  }

  return lines.join('\n');
};

/**
 * Ensure the destination is missing or empty; throw {@link ScaffoldError} otherwise.
 *
 * @param dest - Destination directory path.
 * @returns Promise that resolves when the dest is safe to write.
 */
const assertEmptyDest = async (dest: string): Promise<void> => {
  try {
    const existing = await readdir(dest);
    if (existing.length > 0) {
      throw new ScaffoldError(`Destination ${dest} already exists and is not empty.`);
    }
  } catch (error) {
    if (error instanceof ScaffoldError) {
      throw error;
    }
    // ENOENT — destination doesn't exist yet, which is what we want.
  }
};

/**
 * Copy one maintained package into the buyer kit, preserving nested path under packages/.
 *
 * @param packagesRoot - Source kit packages root.
 * @param packageDir - Absolute source package directory.
 * @param dest - Buyer kit workspace root.
 * @returns Promise that resolves after the package is copied.
 */
const copyPackageIntoKit = async (
  packagesRoot: string,
  packageDir: string,
  dest: string,
): Promise<void> => {
  const rel = packageRelFromPackagesRoot(packagesRoot, packageDir);
  const packageDest = join(dest, 'packages', rel);
  await mkdir(join(packageDest, '..'), { recursive: true });
  await cp(packageDir, packageDest, {
    recursive: true,
    filter: (src) => shouldCopyScaffoldPath(src),
  });
};

/**
 * Copy a template surface + required private packages into a fresh kit workspace root.
 *
 * Delivers an installable pnpm workspace so `workspace:*` on `@vybekiit/*` resolves locally
 * (ADR-0033 / ADR-0038 Track 2). Does not rewrite deps to public npm. Skips build artifacts
 * via {@link shouldCopyScaffoldPath}. Ensures agent skill symlinks on the surface.
 *
 * @param options - Kit source, destination, and surface template.
 * @returns Destination path after the kit workspace has been written.
 * @example
 * await scaffoldKitWorkspace({
 *   template: 'web',
 *   kitRoot: '/repo',
 *   dest: '/tmp/my-app',
 * });
 */
export const scaffoldKitWorkspace = async (
  options: ScaffoldKitOptions,
): Promise<{ readonly dest: string }> => {
  const surfaceSource = join(options.kitRoot, 'templates', options.template);
  try {
    await access(surfaceSource);
  } catch (error) {
    throw new ScaffoldError(`Template "${options.template}" was not found at ${surfaceSource}.`, {
      cause: error,
    });
  }

  await assertEmptyDest(options.dest);

  const packagesRoot = join(options.kitRoot, 'packages');
  const packageIndex = await indexPackageDirs(packagesRoot);
  const packageDirs = await collectRequiredPackageDirs(
    join(surfaceSource, 'package.json'),
    packageIndex,
  );

  await mkdir(options.dest, { recursive: true });
  await mkdir(join(options.dest, 'packages'), { recursive: true });
  await mkdir(join(options.dest, 'templates'), { recursive: true });

  const surfaceDest = join(options.dest, 'templates', options.template);
  await cp(surfaceSource, surfaceDest, {
    recursive: true,
    filter: (src) => shouldCopyScaffoldPath(src),
  });

  await Promise.all(
    packageDirs.map((packageDir) => copyPackageIntoKit(packagesRoot, packageDir, options.dest)),
  );

  const kitRootPkg = await readPackageJson(join(options.kitRoot, 'package.json'));
  await writeFile(join(options.dest, 'package.json'), buildRootPackageJson(kitRootPkg));

  let sourceWorkspaceYaml: string | null = null;
  try {
    sourceWorkspaceYaml = await readFile(join(options.kitRoot, 'pnpm-workspace.yaml'), 'utf8');
  } catch {
    sourceWorkspaceYaml = null;
  }
  await writeFile(
    join(options.dest, 'pnpm-workspace.yaml'),
    buildPnpmWorkspaceYaml(options.template, sourceWorkspaceYaml),
  );

  // Cursor + Claude discover skills via per-agent paths on the OWNED surface.
  await ensureAgentSkillSymlinks(surfaceDest);

  // First-party MCPs always ship: packages (via KIT_ALWAYS_SHIP) + project configs.
  await shipFirstPartyMcpConfigs({ dest: options.dest, template: options.template });

  return { dest: options.dest };
};
