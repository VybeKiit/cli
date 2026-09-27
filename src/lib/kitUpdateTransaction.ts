import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import type { KitUpdateInspection } from './kitUpdateInspection';
import { KIT_WORKSPACE_MANIFEST_PATH, writeKitWorkspaceManifest } from './kitUpdateManifest';
import { pathExists } from './pathExists';

const execFileAsync = promisify(execFile);

const copyWorkspacePath = async (
  sourceRoot: string,
  destinationRoot: string,
  workspacePath: string,
): Promise<void> => {
  const sourcePath = join(sourceRoot, workspacePath);
  const destinationPath = join(destinationRoot, workspacePath);
  if (!(await pathExists(sourcePath))) {
    await rm(destinationPath, { recursive: true, force: true });
    return;
  }
  await mkdir(dirname(destinationPath), { recursive: true });
  await rm(destinationPath, { recursive: true, force: true });
  const sourceStatus = await lstat(sourcePath);
  await cp(sourcePath, destinationPath, {
    recursive: sourceStatus.isDirectory(),
    force: true,
  });
};

const overlayMaintainedPaths = async (
  sourceRoot: string,
  destinationRoot: string,
  maintainedPaths: readonly string[],
): Promise<void> => {
  await Promise.all(
    maintainedPaths.map(
      async (workspacePath) => await copyWorkspacePath(sourceRoot, destinationRoot, workspacePath),
    ),
  );
};

const copyBuyerWorkspace = async (projectRoot: string, previewRoot: string): Promise<void> => {
  await rm(previewRoot, { recursive: true, force: true });
  await mkdir(previewRoot, { recursive: true });
  const projectEntries = await readdir(projectRoot, { withFileTypes: true });
  const copyableEntries = projectEntries.filter(
    (projectEntry) =>
      projectEntry.name !== '.git' &&
      projectEntry.name !== 'node_modules' &&
      projectEntry.name !== '.vybekiit-update',
  );
  await Promise.all(
    copyableEntries.map(
      async (projectEntry) =>
        await cp(join(projectRoot, projectEntry.name), join(previewRoot, projectEntry.name), {
          recursive: true,
          force: true,
        }),
    ),
  );
};

const verifyPreview = async (previewRoot: string): Promise<boolean> => {
  const hasLock = await pathExists(join(previewRoot, 'pnpm-lock.yaml'));
  const installArguments = hasLock
    ? ['install', '--frozen-lockfile', '--ignore-scripts']
    : ['install', '--no-frozen-lockfile', '--ignore-scripts'];
  return await execFileAsync('pnpm', installArguments, {
    cwd: previewRoot,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  })
    .then(async () =>
      execFileAsync('pnpm', ['verify'], {
        cwd: previewRoot,
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      }),
    )
    .then(() => true)
    .catch(() => false);
};

const restoreBuyerPaths = async (
  projectRoot: string,
  backupRoot: string,
  buyerPaths: readonly { readonly workspacePath: string; readonly existed: boolean }[],
): Promise<void> => {
  await Promise.all(
    buyerPaths.map(async (buyerPath) => {
      if (buyerPath.existed) {
        await copyWorkspacePath(backupRoot, projectRoot, buyerPath.workspacePath);
        return;
      }
      await rm(join(projectRoot, buyerPath.workspacePath), { recursive: true, force: true });
    }),
  );
};

const applyVerifiedPreview = async (
  projectRoot: string,
  previewRoot: string,
  backupRoot: string,
  inspection: KitUpdateInspection,
): Promise<void> => {
  const protectedPaths = [...inspection.changedMaintainedPaths, KIT_WORKSPACE_MANIFEST_PATH];
  await rm(backupRoot, { recursive: true, force: true });
  await mkdir(backupRoot, { recursive: true });
  const buyerPaths = await Promise.all(
    protectedPaths.map(async (workspacePath) => ({
      workspacePath,
      existed: await pathExists(join(projectRoot, workspacePath)),
    })),
  );
  await Promise.all(
    buyerPaths
      .filter((buyerPath) => buyerPath.existed)
      .map(
        async (buyerPath) =>
          await copyWorkspacePath(projectRoot, backupRoot, buyerPath.workspacePath),
      ),
  );
  await overlayMaintainedPaths(previewRoot, projectRoot, inspection.changedMaintainedPaths)
    .then(async () => {
      await writeKitWorkspaceManifest({
        projectRoot,
        kitVersion: inspection.plan.targetVersion,
        surface: inspection.manifest.surface,
        ownedFileHashes: inspection.manifest.ownedFileHashes,
      });
    })
    .catch(async (updateFailure: unknown) => {
      await restoreBuyerPaths(projectRoot, backupRoot, buyerPaths);
      throw updateFailure;
    });
};

export const testAndApplyKitUpdate = async (
  projectRoot: string,
  kitSourceRoot: string,
  inspection: KitUpdateInspection,
): Promise<'applied' | 'verification-failed'> => {
  const updateRoot = join(projectRoot, '.vybekiit-update');
  const previewRoot = join(updateRoot, 'preview');
  const backupRoot = join(updateRoot, 'backup');
  return await copyBuyerWorkspace(projectRoot, previewRoot)
    .then(async () => {
      await overlayMaintainedPaths(kitSourceRoot, previewRoot, inspection.changedMaintainedPaths);
      await writeKitWorkspaceManifest({
        projectRoot: previewRoot,
        kitVersion: inspection.plan.targetVersion,
        surface: inspection.manifest.surface,
        ownedFileHashes: inspection.manifest.ownedFileHashes,
      });
      return await verifyPreview(previewRoot);
    })
    .then(async (verificationPassed) => {
      if (!verificationPassed) {
        return 'verification-failed';
      }
      await applyVerifiedPreview(projectRoot, previewRoot, backupRoot, inspection);
      return 'applied';
    })
    .finally(async () => await rm(updateRoot, { recursive: true, force: true }));
};
