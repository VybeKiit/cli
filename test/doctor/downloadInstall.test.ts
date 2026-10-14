import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { InstallStep, Platform } from '../../src/doctor/toolchain';

const setupLog = vi.hoisted(() => ({
  appendSetupLog: vi.fn((_heading: string) => undefined),
  runLoggedProcess: vi.fn(async (_command: string, _commandArguments: readonly string[]) => ({
    code: 0,
    stdout: '',
    stderr: '',
  })),
}));

vi.mock('../../src/lib/setupLog', () => setupLog);

const { executableName, installGithubRelease, releaseAssetName, releaseAssetUrl, releaseVersion } =
  await import('../../src/doctor/downloadInstall');
const { GH } = await import('../../src/doctor/toolDeclarations');
const { toolFolders } = await import('../../src/doctor/toolFolders');

const GH_MAC_ASSETS = {
  x64: 'gh_{version}_macOS_amd64.zip',
  arm64: 'gh_{version}_macOS_arm64.zip',
};

describe('releaseAssetName', () => {
  it('picks the Apple silicon build on arm64', () => {
    expect(releaseAssetName(GH_MAC_ASSETS, 'v2.81.0', 'arm64')).toBe('gh_2.81.0_macOS_arm64.zip');
  });

  it('picks the Intel build on x64 and on unknown CPUs', () => {
    expect(releaseAssetName(GH_MAC_ASSETS, 'v2.81.0', 'x64')).toBe('gh_2.81.0_macOS_amd64.zip');
    expect(releaseAssetName(GH_MAC_ASSETS, 'v2.81.0', 'ia32')).toBe('gh_2.81.0_macOS_amd64.zip');
  });

  it('keeps asset names that carry no version', () => {
    const supabaseAssets = {
      x64: 'supabase_linux_amd64.tar.gz',
      arm64: 'supabase_linux_arm64.tar.gz',
    };
    expect(releaseAssetName(supabaseAssets, 'v2.50.0', 'arm64')).toBe(
      'supabase_linux_arm64.tar.gz',
    );
  });
});

describe('release helpers', () => {
  it('drops the leading v from a release tag', () => {
    expect(releaseVersion('v2.81.0')).toBe('2.81.0');
    expect(releaseVersion('2.81.0')).toBe('2.81.0');
  });

  it('builds the GitHub download URL for a release asset', () => {
    expect(releaseAssetUrl('cli/cli', 'v2.81.0', 'gh_2.81.0_linux_amd64.tar.gz')).toBe(
      'https://github.com/cli/cli/releases/download/v2.81.0/gh_2.81.0_linux_amd64.tar.gz',
    );
  });

  it('adds .exe only on Windows', () => {
    expect(executableName('gh', 'win32')).toBe('gh.exe');
    expect(executableName('gh', 'darwin')).toBe('gh');
    expect(executableName('gh', 'linux')).toBe('gh');
  });
});

const REAL_PLATFORM = process.platform;
const REAL_ARCHITECTURE = process.arch;
const GH_RELEASE_PAGE = 'https://github.com/cli/cli/releases/tag/v2.102.0';
const GH_DOWNLOADS = 'https://github.com/cli/cli/releases/download/v2.102.0';

const simulateMachine = (platform: NodeJS.Platform, architecture: NodeJS.Architecture): void => {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
  Object.defineProperty(process, 'arch', { value: architecture, configurable: true });
};

const makeBuyerHome = (): string => {
  const buyerHome = mkdtempSync(join(tmpdir(), 'vybekiit-release-'));
  onTestFinished(() => rmSync(buyerHome, { recursive: true, force: true }));
  return buyerHome;
};

const ghReleaseStep = (platform: Platform): InstallStep<'release'> => {
  const installStep = GH.install[platform];
  if (installStep?.kind !== 'release') {
    throw new Error(`gh has no release install on ${platform}`);
  }
  return installStep;
};

const githubResponse = async (url: string, requestSettings?: RequestInit) =>
  requestSettings?.method === 'HEAD' ? { url: GH_RELEASE_PAGE } : new Response(`archive ${url}`);

const extractArchiveWith =
  (binaryName: string) => (_command: string, tarArguments: readonly string[]) => {
    const [, , , extractFolder = ''] = tarArguments;
    const binaryFolder = join(extractFolder, 'gh_release', 'bin');
    mkdirSync(binaryFolder, { recursive: true });
    writeFileSync(join(binaryFolder, binaryName), 'gh binary');
    return Promise.resolve({ code: 0, stdout: '', stderr: '' });
  };

describe('installGithubRelease', () => {
  const fetchRelease = vi.fn(githubResponse);

  beforeEach(() => {
    fetchRelease.mockClear();
    setupLog.appendSetupLog.mockClear();
    setupLog.runLoggedProcess.mockReset();
    vi.stubGlobal('fetch', fetchRelease);
    vi.stubEnv('SystemRoot', 'C:\\Windows');
  });

  afterEach(() => {
    simulateMachine(REAL_PLATFORM, REAL_ARCHITECTURE);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('installs gh.exe with the Windows tar on Windows', async () => {
    simulateMachine('win32', 'x64');
    setupLog.runLoggedProcess.mockImplementation(extractArchiveWith('gh.exe'));
    const folders = toolFolders(makeBuyerHome(), 'win32');

    await expect(installGithubRelease('gh', ghReleaseStep('win32'), folders)).resolves.toBe(true);

    expect(fetchRelease).toHaveBeenCalledWith(
      `${GH_DOWNLOADS}/gh_2.102.0_windows_amd64.zip`,
      expect.any(Object),
    );
    expect(setupLog.runLoggedProcess.mock.calls[0]?.[0]).toBe(
      join('C:\\Windows', 'System32', 'tar.exe'),
    );
    expect(existsSync(join(folders.binaries, 'gh.exe'))).toBe(true);
    expect(readdirSync(folders.downloads)).toEqual([]);
  });

  it('installs the Apple silicon gh with the system tar on macOS', async () => {
    simulateMachine('darwin', 'arm64');
    setupLog.runLoggedProcess.mockImplementation(extractArchiveWith('gh'));
    const folders = toolFolders(makeBuyerHome(), 'darwin');

    await expect(installGithubRelease('gh', ghReleaseStep('darwin'), folders)).resolves.toBe(true);

    expect(fetchRelease).toHaveBeenCalledWith(
      `${GH_DOWNLOADS}/gh_2.102.0_macOS_arm64.zip`,
      expect.any(Object),
    );
    expect(setupLog.runLoggedProcess.mock.calls[0]?.[0]).toBe('tar');
    expect(existsSync(join(folders.binaries, 'gh'))).toBe(true);
  });

  it('reports a failure when the Windows archive has no gh.exe', async () => {
    simulateMachine('win32', 'x64');
    setupLog.runLoggedProcess.mockImplementation(extractArchiveWith('gh'));
    const folders = toolFolders(makeBuyerHome(), 'win32');

    await expect(installGithubRelease('gh', ghReleaseStep('win32'), folders)).resolves.toBe(false);

    expect(setupLog.appendSetupLog).toHaveBeenCalledWith(
      'gh install failed: gh.exe not found in gh_2.102.0_windows_amd64.zip',
    );
    expect(existsSync(folders.binaries)).toBe(false);
  });
});
