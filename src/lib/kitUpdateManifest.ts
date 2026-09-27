import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, readlink, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { AGENT_LAYER_PATHS, isAgentLayerExtensionPath } from '@vybekiit/agent-kit';
import { Schema } from 'effect';

import type { TemplateName } from './scaffold';

export const KIT_WORKSPACE_MANIFEST_PATH = '.vybekiit-kit.json';

export const KitWorkspaceManifest = Schema.Struct({
  manifestVersion: Schema.Literal(1),
  kitVersion: Schema.String,
  surface: Schema.Literal('web', 'spa', 'mobile', 'extension', 'backend'),
  ownedFileHashes: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export type KitWorkspaceManifest = Schema.Schema.Type<typeof KitWorkspaceManifest>;

const pathUnderAgentLayerEntry = (surfacePath: string, agentLayerPath: string): boolean =>
  surfacePath === agentLayerPath || surfacePath.startsWith(`${agentLayerPath}/`);

export const isAgentInstructionWorkspacePath = (
  workspacePath: string,
  surface: TemplateName,
): boolean => {
  const surfacePrefix = `templates/${surface}/`;
  if (!workspacePath.startsWith(surfacePrefix)) {
    return false;
  }
  const surfacePath = workspacePath.slice(surfacePrefix.length);
  if (isAgentLayerExtensionPath(surfacePath)) {
    return false;
  }
  return AGENT_LAYER_PATHS.some((agentLayerPath) =>
    pathUnderAgentLayerEntry(surfacePath, agentLayerPath),
  );
};

export const isOwnedWorkspacePath = (workspacePath: string, surface: TemplateName): boolean =>
  workspacePath.startsWith(`templates/${surface}/`) &&
  !isAgentInstructionWorkspacePath(workspacePath, surface);

const ignoredWorkspaceDirectory = (directoryName: string): boolean =>
  directoryName === '.git' ||
  directoryName === 'node_modules' ||
  directoryName === 'dist' ||
  directoryName === '.next' ||
  directoryName === '.turbo' ||
  directoryName === 'coverage';

export const workspaceFilePaths = async (
  workspaceRoot: string,
  scanRoot: string = workspaceRoot,
): Promise<readonly string[]> => {
  const directoryEntries = await readdir(scanRoot, { withFileTypes: true });
  const nestedPaths = await Promise.all(
    directoryEntries.map(async (directoryEntry): Promise<readonly string[]> => {
      if (directoryEntry.isDirectory() && ignoredWorkspaceDirectory(directoryEntry.name)) {
        return [];
      }
      const absolutePath = join(scanRoot, directoryEntry.name);
      if (directoryEntry.isDirectory()) {
        return await workspaceFilePaths(workspaceRoot, absolutePath);
      }
      return [relative(workspaceRoot, absolutePath).replaceAll('\\', '/')];
    }),
  );
  return nestedPaths.flat().sort((left, right) => left.localeCompare(right));
};

const workspaceFileHash = async (workspaceRoot: string, workspacePath: string): Promise<string> => {
  const absolutePath = join(workspaceRoot, workspacePath);
  const fileStatus = await lstat(absolutePath);
  const fileBytes = fileStatus.isSymbolicLink()
    ? Buffer.from(`link:${await readlink(absolutePath)}`)
    : await readFile(absolutePath);
  return createHash('sha256').update(fileBytes).digest('hex');
};

export const hashWorkspacePaths = async (
  workspaceRoot: string,
  workspacePaths: readonly string[],
): Promise<Readonly<Record<string, string>>> =>
  Object.fromEntries(
    await Promise.all(
      workspacePaths.map(async (workspacePath) => [
        workspacePath,
        await workspaceFileHash(workspaceRoot, workspacePath),
      ]),
    ),
  );

export const createKitWorkspaceManifest = async (manifestFacts: {
  readonly projectRoot: string;
  readonly kitVersion: string;
  readonly surface: TemplateName;
}): Promise<KitWorkspaceManifest> => {
  const surfaceRoot = join(manifestFacts.projectRoot, 'templates', manifestFacts.surface);
  const surfacePaths = await workspaceFilePaths(manifestFacts.projectRoot, surfaceRoot);
  const ownedPaths = surfacePaths.filter((workspacePath) =>
    isOwnedWorkspacePath(workspacePath, manifestFacts.surface),
  );
  return {
    manifestVersion: 1,
    kitVersion: manifestFacts.kitVersion,
    surface: manifestFacts.surface,
    ownedFileHashes: await hashWorkspacePaths(manifestFacts.projectRoot, ownedPaths),
  };
};

export const writeKitWorkspaceManifest = async (manifestFacts: {
  readonly projectRoot: string;
  readonly kitVersion: string;
  readonly surface: TemplateName;
  readonly ownedFileHashes?: Readonly<Record<string, string>>;
}): Promise<KitWorkspaceManifest> => {
  const manifest: KitWorkspaceManifest =
    manifestFacts.ownedFileHashes === undefined
      ? await createKitWorkspaceManifest(manifestFacts)
      : {
          manifestVersion: 1,
          kitVersion: manifestFacts.kitVersion,
          surface: manifestFacts.surface,
          ownedFileHashes: manifestFacts.ownedFileHashes,
        };
  await writeFile(
    join(manifestFacts.projectRoot, KIT_WORKSPACE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
};

export const readKitWorkspaceManifest = async (
  projectRoot: string,
): Promise<KitWorkspaceManifest> => {
  const manifestText = await readFile(join(projectRoot, KIT_WORKSPACE_MANIFEST_PATH), 'utf8');
  return await Schema.decodeUnknownPromise(KitWorkspaceManifest)(JSON.parse(manifestText));
};
