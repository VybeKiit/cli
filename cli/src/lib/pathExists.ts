import { access } from 'node:fs/promises';

/**
 * Probe whether a path exists on disk.
 *
 * @param path - Absolute or relative path to check.
 * @returns True when the path is accessible.
 * @example
 * const ok = await pathExists('/tmp');
 */
export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
