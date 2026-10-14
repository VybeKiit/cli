import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, sep } from 'node:path';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import { runProcess } from '../global/exec';
import { appendSetupLog } from '../lib/setupLog';
import { executableName } from './downloadInstall';
import { type ToolFolders, toolFolders } from './toolFolders';

const PROFILE_MARKER = '# Added by VybeKiit';

const WINDOWS_USER_PATH_SCRIPT = [
  "$toolFolders = $env:VYBEKIIT_TOOL_FOLDERS -split ';'",
  "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')",
  "$userFolders = @($userPath -split ';' | Where-Object { $_ })",
  '$missingFolders = @($toolFolders | Where-Object { $userFolders -notcontains $_ })',
  'if ($missingFolders.Count -gt 0) {',
  "  [Environment]::SetEnvironmentVariable('Path', (($missingFolders + $userFolders) -join ';'), 'User')",
  "  Write-Output 'updated'",
  '}',
].join('\n');

export const shellProfilePath = (
  home: string,
  shell: string,
  platform: NodeJS.Platform,
  profileExists: (profilePath: string) => boolean = existsSync,
): string => {
  const darwinBashProfile = profileExists(join(home, '.bash_profile'))
    ? '.bash_profile'
    : '.profile';
  const profileByShell: Readonly<Record<string, string>> = {
    zsh: '.zshrc',
    bash: platform === 'darwin' ? darwinBashProfile : '.bashrc',
  };
  const shellName = basename(shell);
  return join(home, profileByShell[shellName] || '.profile');
};

export const profilePathLines = (
  home: string,
  folders: readonly string[],
  profileText: string,
): string[] =>
  folders
    .map((folder) => relative(home, folder).split(sep).join('/'))
    .filter((homeFolder) => !profileText.includes(homeFolder))
    .map((homeFolder) => `export PATH="$HOME/${homeFolder}:$PATH" ${PROFILE_MARKER}`);

const foldersWithTools = (folders: ToolFolders, platform: NodeJS.Platform): string[] => {
  const claudeBinary = join(folders.claudeBinaries, executableName('claude', platform));
  const folderChecks = [
    { folder: folders.binaries, toolMarker: folders.binaries },
    { folder: folders.npmBinaries, toolMarker: folders.npmBinaries },
    { folder: folders.claudeBinaries, toolMarker: claudeBinary },
  ];
  return folderChecks
    .filter(({ toolMarker }) => existsSync(toolMarker))
    .map(({ folder }) => folder);
};

const addFoldersToShellProfile = (
  home: string,
  folders: readonly string[],
  profilePath: string,
): boolean => {
  const profileText = existsSync(profilePath) ? readFileSync(profilePath, 'utf8') : '';
  const pathLines = profilePathLines(home, folders, profileText);
  if (pathLines.length === 0) {
    return false;
  }
  const lineBreak = profileText === '' || profileText.endsWith('\n') ? '' : '\n';
  appendFileSync(profilePath, `${lineBreak}${pathLines.join('\n')}\n`);
  return true;
};

const addFoldersToWindowsUserPath = async (folders: readonly string[]): Promise<boolean> => {
  const pathUpdate = await runProcess(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_USER_PATH_SCRIPT],
    { env: { ...process.env, VYBEKIIT_TOOL_FOLDERS: folders.join(';') } },
  );
  return pathUpdate.stdout.includes('updated');
};

export const saveToolFoldersOnPath = async (
  home: string = homedir(),
  platform: NodeJS.Platform = process.platform,
  shell: string = process.env.SHELL || '',
): Promise<boolean> => {
  const folders = foldersWithTools(toolFolders(home, platform), platform);
  if (folders.length === 0) {
    return false;
  }
  try {
    if (platform === 'win32') {
      return await addFoldersToWindowsUserPath(folders);
    }
    const profilePath = shellProfilePath(home, shell, platform);
    return addFoldersToShellProfile(home, folders, profilePath);
  } catch (pathFailure) {
    appendSetupLog(`PATH update failed: ${caughtMessage(pathFailure)}`);
    return false;
  }
};
