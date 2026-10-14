import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import { appendSetupLog, runLoggedProcess } from '../lib/setupLog';
import type { CpuArchitecture, InstallStep } from './toolchain';
import { type ToolFolders, toolFolders } from './toolFolders';

const RELEASE_TAG_PATTERN = /\/releases\/tag\/([^/]+)$/;
const VERSION_PREFIX_PATTERN = /^v/;

export const releaseVersion = (releaseTag: string): string =>
  releaseTag.replace(VERSION_PREFIX_PATTERN, '');

export const releaseAssetName = (
  assetNames: Readonly<Record<CpuArchitecture, string>>,
  releaseTag: string,
  architecture: string,
): string => {
  const assetPattern = architecture === 'arm64' ? assetNames.arm64 : assetNames.x64;
  const version = releaseVersion(releaseTag);
  return assetPattern.replaceAll('{version}', version);
};

export const releaseAssetUrl = (
  repository: string,
  releaseTag: string,
  assetName: string,
): string => `https://github.com/${repository}/releases/download/${releaseTag}/${assetName}`;

export const executableName = (tool: string, platform: NodeJS.Platform): string =>
  platform === 'win32' ? `${tool}.exe` : tool;

const latestReleaseTag = async (repository: string): Promise<string | undefined> => {
  const releasePage = await fetch(`https://github.com/${repository}/releases/latest`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(30_000),
  });
  return RELEASE_TAG_PATTERN.exec(releasePage.url)?.[1];
};

const downloadFile = async (url: string, filePath: string): Promise<void> => {
  const download = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!download.ok) {
    throw new Error(`Download failed with status ${download.status}: ${url}`);
  }
  const fileBytes = await download.arrayBuffer();
  const fileContents = new Uint8Array(fileBytes);
  writeFileSync(filePath, fileContents);
};

const tarCommand = (): string => {
  if (process.platform !== 'win32') {
    return 'tar';
  }
  const windowsFolder = process.env.SystemRoot || 'C:\\Windows';
  return join(windowsFolder, 'System32', 'tar.exe');
};

const findExtractedFile = (folder: string, fileName: string): string | undefined => {
  const extractedPaths = readdirSync(folder, { encoding: 'utf8', recursive: true });
  const matchingPath = extractedPaths.find((extractedPath) => basename(extractedPath) === fileName);
  return matchingPath === undefined ? undefined : join(folder, matchingPath);
};

const withWorkFolder = async (
  tool: string,
  folders: ToolFolders,
  install: (workFolder: string) => Promise<boolean>,
): Promise<boolean> => {
  mkdirSync(folders.downloads, { recursive: true });
  const workFolder = mkdtempSync(join(folders.downloads, `${tool}-`));
  try {
    return await install(workFolder);
  } catch (installFailure) {
    appendSetupLog(`${tool} install failed: ${caughtMessage(installFailure)}`);
    return false;
  } finally {
    rmSync(workFolder, { recursive: true, force: true });
  }
};

export const installGithubRelease = (
  tool: string,
  releaseStep: InstallStep<'release'>,
  folders: ToolFolders = toolFolders(),
): Promise<boolean> =>
  withWorkFolder(tool, folders, async (workFolder) => {
    const releaseTag = await latestReleaseTag(releaseStep.repository);
    if (releaseTag === undefined) {
      appendSetupLog(`${tool} install failed: no latest release for ${releaseStep.repository}`);
      return false;
    }
    const assetName = releaseAssetName(releaseStep.assetNames, releaseTag, process.arch);
    const archivePath = join(workFolder, assetName);
    const assetUrl = releaseAssetUrl(releaseStep.repository, releaseTag, assetName);
    await downloadFile(assetUrl, archivePath);

    const extractFolder = join(workFolder, 'extracted');
    mkdirSync(extractFolder);
    const extraction = await runLoggedProcess(tarCommand(), [
      '-xf',
      archivePath,
      '-C',
      extractFolder,
    ]);
    const binaryName = executableName(tool, process.platform);
    const extractedBinary = findExtractedFile(extractFolder, binaryName);
    if (extraction.code !== 0 || extractedBinary === undefined) {
      appendSetupLog(`${tool} install failed: ${binaryName} not found in ${assetName}`);
      return false;
    }

    mkdirSync(folders.binaries, { recursive: true });
    const installedBinary = join(folders.binaries, binaryName);
    copyFileSync(extractedBinary, installedBinary);
    chmodSync(installedBinary, 0o755);
    return true;
  });

export const runDownloadedScript = (
  tool: string,
  scriptUrl: string,
  folders: ToolFolders = toolFolders(),
): Promise<boolean> =>
  withWorkFolder(tool, folders, async (workFolder) => {
    const scriptPath = join(workFolder, 'install.sh');
    await downloadFile(scriptUrl, scriptPath);
    const scriptRun = await runLoggedProcess('bash', [scriptPath]);
    return scriptRun.code === 0;
  });
