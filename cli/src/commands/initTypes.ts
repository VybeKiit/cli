import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type InitPackageJson = {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly scripts?: Record<string, string>;
  readonly packageManager?: string;
  readonly [key: string]: unknown;
};

/**
 * Check whether a path exists on disk.
 *
 * @param path - Absolute path to probe.
 * @returns True when the path is accessible.
 * @example
 * const exists = await pathExists('/tmp/app/package.json');
 */
export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Read package metadata from a project directory.
 *
 * @param cwd - Project directory to inspect.
 * @returns Parsed package metadata, or null when `package.json` is missing.
 * @example
 * const pkg = await readInitPackageJson(process.cwd());
 */
export const readInitPackageJson = async (cwd: string): Promise<InitPackageJson | null> => {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf8');
    return JSON.parse(raw) as InitPackageJson;
  } catch {
    return null;
  }
};
