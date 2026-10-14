import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import process from 'node:process';

export type ToolFolders = {
  readonly downloads: string;
  readonly binaries: string;
  readonly npmPrefix: string;
  readonly npmBinaries: string;
  readonly claudeBinaries: string;
};

export const toolFolders = (
  home: string = homedir(),
  platform: NodeJS.Platform = process.platform,
): ToolFolders => {
  const vybekiitHome = join(home, '.vybekiit');
  const npmPrefix = join(vybekiitHome, 'npm');
  return {
    downloads: join(vybekiitHome, 'downloads'),
    binaries: join(vybekiitHome, 'bin'),
    npmPrefix,
    npmBinaries: platform === 'win32' ? npmPrefix : join(npmPrefix, 'bin'),
    claudeBinaries: join(home, '.local', 'bin'),
  };
};

export const npmUserInstallArguments = (
  packageName: string,
  npmPrefix: string = toolFolders().npmPrefix,
): readonly string[] => [
  'install',
  '--global',
  '--prefix',
  npmPrefix,
  '--no-fund',
  '--no-audit',
  packageName,
];

export const toolPathFolders = (folders: ToolFolders): readonly string[] => [
  folders.binaries,
  folders.npmBinaries,
  folders.claudeBinaries,
];

export const pathWithToolFolders = (
  searchPath: string,
  folders: readonly string[],
  separator: string = delimiter,
): string => {
  const searchFolders = searchPath.split(separator).filter(Boolean);
  const missingFolders = folders.filter((folder) => !searchFolders.includes(folder));
  return [...missingFolders, ...searchFolders].join(separator);
};

export const addToolFoldersToProcessPath = (): void => {
  const folders = toolFolders();
  const searchFolders = toolPathFolders(folders);
  process.env.PATH = pathWithToolFolders(process.env.PATH || '', searchFolders);
};
