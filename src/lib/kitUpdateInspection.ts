import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { planSafeKitUpdate, type SafeKitUpdatePlan } from '@vybekiit/agent-kit';
import { Schema } from 'effect';

import {
  hashWorkspacePaths,
  isAgentInstructionWorkspacePath,
  isOwnedWorkspacePath,
  type KitWorkspaceManifest,
  readKitWorkspaceManifest,
  workspaceFilePaths,
} from './kitUpdateManifest';
import { pathExists } from './pathExists';
import type { TemplateName } from './scaffold';

const WORKSPACE_SUPPORT_PATHS = [
  'tsconfig.base.json',
  'tsup.base.ts',
  'scripts/lib/packageExportEntries.mjs',
  'scripts/lib/tsupWorkspaceAliases.mjs',
  'scripts/lib/tsupWorkspaceAliases.d.mts',
  'scripts/lib/repoRoot.mjs',
] as const;

const KitSourcePackage = Schema.Struct({ version: Schema.String });

export type KitUpdateInspection = {
  readonly manifest: KitWorkspaceManifest;
  readonly plan: SafeKitUpdatePlan;
  readonly changedMaintainedPaths: readonly string[];
};

type KitUpdateTrees = {
  readonly projectRoot: string;
  readonly kitSourceRoot: string;
  readonly buyerPaths: readonly string[];
  readonly sourcePaths: readonly string[];
};

const packageVersion = async (packagePath: string): Promise<string> => {
  const packageText = await readFile(packagePath, 'utf8');
  const kitPackage = await Schema.decodeUnknownPromise(KitSourcePackage)(JSON.parse(packageText));
  return kitPackage.version;
};

const packageRootFromManifestPath = (workspacePath: string): string | null => {
  const pathParts = workspacePath.split('/');
  if (pathParts[0] !== 'packages' || pathParts.at(-1) !== 'package.json') {
    return null;
  }
  return pathParts[1] === 'tools' && pathParts.length >= 4
    ? pathParts.slice(0, 3).join('/')
    : pathParts.slice(0, 2).join('/');
};

const maintainedPathsFor = (
  workspacePaths: readonly string[],
  surface: TemplateName,
  packageRoots: ReadonlySet<string>,
): readonly string[] =>
  workspacePaths.filter((workspacePath) => {
    const packagePath = [...packageRoots].some(
      (packageRoot) => workspacePath === packageRoot || workspacePath.startsWith(`${packageRoot}/`),
    );
    const workspaceSupportPath = WORKSPACE_SUPPORT_PATHS.some(
      (supportPath) => workspacePath === supportPath,
    );
    return (
      packagePath || workspaceSupportPath || isAgentInstructionWorkspacePath(workspacePath, surface)
    );
  });

const fallbackManifest = async (
  projectRoot: string,
  surface: TemplateName,
): Promise<KitWorkspaceManifest> => {
  const surfacePaths = await workspaceFilePaths(
    projectRoot,
    join(projectRoot, 'templates', surface),
  );
  const ownedPaths = surfacePaths.filter((workspacePath) =>
    isOwnedWorkspacePath(workspacePath, surface),
  );
  const currentVersion = await packageVersion(
    join(projectRoot, 'packages', 'core', 'package.json'),
  ).catch(() => 'unknown');
  return {
    manifestVersion: 1,
    kitVersion: currentVersion,
    surface,
    ownedFileHashes: await hashWorkspacePaths(projectRoot, ownedPaths),
  };
};

const detectWorkspaceSurface = async (projectRoot: string): Promise<TemplateName> => {
  const surfaces = ['web', 'spa', 'mobile', 'extension', 'backend'] as const;
  const surfaceChecks = await Promise.all(
    surfaces.map(async (surface) => ({
      surface,
      exists: await pathExists(join(projectRoot, 'templates', surface, 'package.json')),
    })),
  );
  const detectedSurface = surfaceChecks.find((surfaceCheck) => surfaceCheck.exists)?.surface;
  if (detectedSurface === undefined) {
    throw new Error('This folder is not a VybeKiit app workspace.');
  }
  return detectedSurface;
};

const changedMaintainedPaths = async (
  kitUpdateTrees: KitUpdateTrees,
  surface: TemplateName,
): Promise<readonly string[]> => {
  const packageRoots = new Set(
    kitUpdateTrees.buyerPaths
      .map(packageRootFromManifestPath)
      .filter((packageRoot): packageRoot is string => packageRoot !== null),
  );
  const buyerMaintainedPaths = maintainedPathsFor(kitUpdateTrees.buyerPaths, surface, packageRoots);
  const sourceMaintainedPaths = maintainedPathsFor(
    kitUpdateTrees.sourcePaths,
    surface,
    packageRoots,
  );
  const [buyerHashes, sourceHashes] = await Promise.all([
    hashWorkspacePaths(kitUpdateTrees.projectRoot, buyerMaintainedPaths),
    hashWorkspacePaths(kitUpdateTrees.kitSourceRoot, sourceMaintainedPaths),
  ]);
  return [...new Set([...buyerMaintainedPaths, ...sourceMaintainedPaths])]
    .filter((workspacePath) => buyerHashes[workspacePath] !== sourceHashes[workspacePath])
    .sort((left, right) => left.localeCompare(right));
};

const ownedChanges = async (
  kitUpdateTrees: KitUpdateTrees,
  manifest: KitWorkspaceManifest,
): Promise<{
  readonly incomingOwnedPaths: readonly string[];
  readonly buyerChangedOwnedPaths: readonly string[];
}> => {
  const buyerOwnedPaths = kitUpdateTrees.buyerPaths.filter((workspacePath) =>
    isOwnedWorkspacePath(workspacePath, manifest.surface),
  );
  const sourceOwnedPaths = kitUpdateTrees.sourcePaths.filter((workspacePath) =>
    isOwnedWorkspacePath(workspacePath, manifest.surface),
  );
  const [buyerHashes, sourceHashes] = await Promise.all([
    hashWorkspacePaths(kitUpdateTrees.projectRoot, buyerOwnedPaths),
    hashWorkspacePaths(kitUpdateTrees.kitSourceRoot, sourceOwnedPaths),
  ]);
  const ownedUniverse = new Set([
    ...Object.keys(manifest.ownedFileHashes),
    ...buyerOwnedPaths,
    ...sourceOwnedPaths,
  ]);
  return {
    incomingOwnedPaths: [...ownedUniverse].filter(
      (workspacePath) => sourceHashes[workspacePath] !== manifest.ownedFileHashes[workspacePath],
    ),
    buyerChangedOwnedPaths: [...ownedUniverse].filter(
      (workspacePath) =>
        buyerHashes[workspacePath] !== manifest.ownedFileHashes[workspacePath] &&
        buyerHashes[workspacePath] !== sourceHashes[workspacePath],
    ),
  };
};

export const inspectKitUpdate = async (
  projectRoot: string,
  kitSourceRoot: string,
): Promise<KitUpdateInspection> => {
  const surface = await detectWorkspaceSurface(projectRoot);
  const manifest = await readKitWorkspaceManifest(projectRoot).catch(
    async () => await fallbackManifest(projectRoot, surface),
  );
  const [buyerPaths, sourcePaths, targetVersion] = await Promise.all([
    workspaceFilePaths(projectRoot),
    workspaceFilePaths(kitSourceRoot),
    packageVersion(join(kitSourceRoot, 'package.json')),
  ]);
  const kitUpdateTrees: KitUpdateTrees = {
    projectRoot,
    kitSourceRoot,
    buyerPaths,
    sourcePaths,
  };
  const maintainedPaths = await changedMaintainedPaths(kitUpdateTrees, manifest.surface);
  const ownedPathChanges = await ownedChanges(kitUpdateTrees, manifest);
  return {
    manifest,
    changedMaintainedPaths: maintainedPaths,
    plan: planSafeKitUpdate({
      currentVersion: manifest.kitVersion,
      targetVersion,
      changedMaintainedPaths: maintainedPaths,
      incomingOwnedPaths: ownedPathChanges.incomingOwnedPaths,
      buyerOwnedPaths: ownedPathChanges.buyerChangedOwnedPaths,
    }),
  };
};
