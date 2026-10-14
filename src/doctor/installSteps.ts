import type { InstallStep, Tool } from './toolchain';

export const npmEverywhere = (packageName: string): Tool['install'] => {
  const npmStep: InstallStep = { kind: 'npm', packageName };
  return { darwin: npmStep, win32: npmStep, linux: npmStep };
};

export const githubRelease = (
  repository: string,
  x64AssetName: string,
  arm64AssetName: string,
): InstallStep => ({
  kind: 'release',
  repository,
  assetNames: { x64: x64AssetName, arm64: arm64AssetName },
});

export const homebrewInstall = (...formula: readonly string[]): InstallStep => ({
  kind: 'command',
  command: 'brew',
  args: ['install', ...formula],
  requires: 'Homebrew',
});

export const wingetInstall = (packageId: string): InstallStep => ({
  kind: 'command',
  command: 'winget',
  args: [
    'install',
    '--id',
    packageId,
    '--exact',
    '--silent',
    '--accept-package-agreements',
    '--accept-source-agreements',
  ],
  requires: 'App Installer (winget) from the Microsoft Store',
});

export const snapInstall = (snapName: string): InstallStep => ({
  kind: 'command',
  command: 'sudo',
  args: ['snap', 'install', snapName, '--classic'],
});

export const aptInstall = (packageName: string): InstallStep => ({
  kind: 'command',
  command: 'sudo',
  args: ['apt-get', 'install', '-y', packageName],
});
