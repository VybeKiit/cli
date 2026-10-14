import { describe, expect, it } from 'vitest';
import {
  npmUserInstallArguments,
  pathWithToolFolders,
  toolFolders,
  toolPathFolders,
} from '../../src/doctor/toolFolders';

describe('toolFolders', () => {
  it('keeps every tool inside the user home on macOS and Linux', () => {
    const folders = toolFolders('/Users/me', 'darwin');
    expect(folders).toEqual({
      downloads: '/Users/me/.vybekiit/downloads',
      binaries: '/Users/me/.vybekiit/bin',
      npmPrefix: '/Users/me/.vybekiit/npm',
      npmBinaries: '/Users/me/.vybekiit/npm/bin',
      claudeBinaries: '/Users/me/.local/bin',
    });
  });

  it('uses the npm prefix itself as the bin folder on Windows', () => {
    const folders = toolFolders('/Users/me', 'win32');
    expect(folders.npmBinaries).toBe(folders.npmPrefix);
  });

  it('lists the folders new terminals need on PATH', () => {
    const folders = toolFolders('/home/me', 'linux');
    expect(toolPathFolders(folders)).toEqual([
      '/home/me/.vybekiit/bin',
      '/home/me/.vybekiit/npm/bin',
      '/home/me/.local/bin',
    ]);
  });
});

describe('pathWithToolFolders', () => {
  it('puts missing tool folders first', () => {
    expect(pathWithToolFolders('/usr/bin:/bin', ['/home/me/.vybekiit/bin'], ':')).toBe(
      '/home/me/.vybekiit/bin:/usr/bin:/bin',
    );
  });

  it('does not add a folder twice', () => {
    expect(
      pathWithToolFolders('/home/me/.vybekiit/bin:/usr/bin', ['/home/me/.vybekiit/bin'], ':'),
    ).toBe('/home/me/.vybekiit/bin:/usr/bin');
  });

  it('uses the Windows separator', () => {
    expect(pathWithToolFolders('C:\\Windows', ['C:\\Users\\me\\.vybekiit\\bin'], ';')).toBe(
      'C:\\Users\\me\\.vybekiit\\bin;C:\\Windows',
    );
  });
});

describe('npmUserInstallArguments', () => {
  it('installs global npm tools into the user prefix, so no sudo is needed', () => {
    expect(npmUserInstallArguments('wrangler', '/Users/me/.vybekiit/npm')).toEqual([
      'install',
      '--global',
      '--prefix',
      '/Users/me/.vybekiit/npm',
      '--no-fund',
      '--no-audit',
      'wrangler',
    ]);
  });
});
