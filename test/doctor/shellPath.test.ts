import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { ExecResult } from '../../src/global/exec';

const runProcess = vi.hoisted(() =>
  vi.fn(
    async (_command: string, _commandArguments: readonly string[], _spawnSettings?: object) => ({
      code: 0,
      stdout: '',
      stderr: '',
    }),
  ),
);

vi.mock('../../src/global/exec', () => ({ runProcess }));
vi.mock('../../src/lib/setupLog', () => ({ appendSetupLog: vi.fn() }));

const { profilePathLines, saveToolFoldersOnPath, shellProfilePath } = await import(
  '../../src/doctor/shellPath'
);
const { toolFolders } = await import('../../src/doctor/toolFolders');

const powershellOutput = (stdout: string): ExecResult => ({ code: 0, stdout, stderr: '' });

const makeBuyerHome = (): string => {
  const buyerHome = mkdtempSync(join(tmpdir(), 'vybekiit-path-'));
  onTestFinished(() => rmSync(buyerHome, { recursive: true, force: true }));
  return buyerHome;
};

describe('shellProfilePath', () => {
  it('uses .zshrc for zsh', () => {
    expect(shellProfilePath('/Users/me', '/bin/zsh', 'darwin')).toBe('/Users/me/.zshrc');
  });

  it('uses .bashrc for bash on Linux', () => {
    expect(shellProfilePath('/home/me', '/bin/bash', 'linux')).toBe('/home/me/.bashrc');
  });

  it('uses .bash_profile for bash on macOS when it exists, otherwise .profile', () => {
    expect(shellProfilePath('/Users/me', '/bin/bash', 'darwin', () => true)).toBe(
      '/Users/me/.bash_profile',
    );
    expect(shellProfilePath('/Users/me', '/bin/bash', 'darwin', () => false)).toBe(
      '/Users/me/.profile',
    );
  });

  it('falls back to .profile for other shells', () => {
    expect(shellProfilePath('/home/me', '/usr/bin/fish', 'linux')).toBe('/home/me/.profile');
    expect(shellProfilePath('/home/me', '', 'linux')).toBe('/home/me/.profile');
  });
});

describe('profilePathLines', () => {
  it('adds each tool folder relative to HOME', () => {
    expect(
      profilePathLines('/Users/me', ['/Users/me/.vybekiit/bin', '/Users/me/.local/bin'], ''),
    ).toEqual([
      'export PATH="$HOME/.vybekiit/bin:$PATH" # Added by VybeKiit',
      'export PATH="$HOME/.local/bin:$PATH" # Added by VybeKiit',
    ]);
  });

  it('skips folders the profile already adds', () => {
    const profileText = 'export PATH="$HOME/.local/bin:$PATH"\n';
    expect(
      profilePathLines(
        '/Users/me',
        ['/Users/me/.vybekiit/bin', '/Users/me/.local/bin'],
        profileText,
      ),
    ).toEqual(['export PATH="$HOME/.vybekiit/bin:$PATH" # Added by VybeKiit']);
  });
});

describe('saveToolFoldersOnPath', () => {
  beforeEach(() => {
    runProcess.mockReset();
    runProcess.mockResolvedValue(powershellOutput('updated\n'));
  });

  it('adds the tool folders to the Windows user Path through PowerShell', async () => {
    const buyerHome = makeBuyerHome();
    const folders = toolFolders(buyerHome, 'win32');
    mkdirSync(folders.binaries, { recursive: true });
    mkdirSync(folders.claudeBinaries, { recursive: true });
    writeFileSync(join(folders.claudeBinaries, 'claude.exe'), 'claude');

    await expect(saveToolFoldersOnPath(buyerHome, 'win32', '')).resolves.toBe(true);

    expect(runProcess).toHaveBeenCalledWith(
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        expect.stringContaining("GetEnvironmentVariable('Path', 'User')"),
      ],
      {
        env: expect.objectContaining({
          VYBEKIIT_TOOL_FOLDERS: `${folders.binaries};${folders.claudeBinaries}`,
        }),
      },
    );
    expect(existsSync(join(buyerHome, '.profile'))).toBe(false);
  });

  it('reports no change when the Windows user Path already has the folders', async () => {
    const buyerHome = makeBuyerHome();
    mkdirSync(toolFolders(buyerHome, 'win32').binaries, { recursive: true });
    runProcess.mockResolvedValue(powershellOutput(''));

    await expect(saveToolFoldersOnPath(buyerHome, 'win32', '')).resolves.toBe(false);
  });

  it('adds the tool folders to .zshrc once on macOS', async () => {
    const buyerHome = makeBuyerHome();
    mkdirSync(toolFolders(buyerHome, 'darwin').binaries, { recursive: true });

    await expect(saveToolFoldersOnPath(buyerHome, 'darwin', '/bin/zsh')).resolves.toBe(true);
    await expect(saveToolFoldersOnPath(buyerHome, 'darwin', '/bin/zsh')).resolves.toBe(false);

    expect(readFileSync(join(buyerHome, '.zshrc'), 'utf8')).toBe(
      'export PATH="$HOME/.vybekiit/bin:$PATH" # Added by VybeKiit\n',
    );
    expect(runProcess).not.toHaveBeenCalled();
  });

  it('changes nothing when no tools are installed yet', async () => {
    const buyerHome = makeBuyerHome();

    await expect(saveToolFoldersOnPath(buyerHome, 'win32', '')).resolves.toBe(false);
    await expect(saveToolFoldersOnPath(buyerHome, 'darwin', '/bin/zsh')).resolves.toBe(false);

    expect(runProcess).not.toHaveBeenCalled();
    expect(existsSync(join(buyerHome, '.zshrc'))).toBe(false);
  });
});
