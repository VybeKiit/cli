import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Filename under Claude config dir that records the last successful global install. */
export const INSTALL_STATE_FILENAME = '.vybekiit-install.json';

/** Last successful global install stamp (written by {@link writeInstallState}). */
export type InstallState = {
  /** CLI version that last provisioned skills / MCP / awareness. */
  readonly version: string;
  /** ISO timestamp of that install. */
  readonly updatedAt: string;
};

/**
 * Path to the install-state file for a given Claude config dir.
 *
 * @param configDir - Claude user config dir (~/.claude).
 * @returns Absolute path to the state file.
 */
export const installStatePath = (configDir: string): string =>
  join(configDir, INSTALL_STATE_FILENAME);

/**
 * Read the previous global-install stamp, if any.
 *
 * @param configDir - Claude user config dir.
 * @returns Prior state, or null when missing/invalid (first install).
 * @example
 * const previous = await readInstallState(paths.configDir);
 */
export const readInstallState = async (configDir: string): Promise<InstallState | null> => {
  try {
    const raw = await readFile(installStatePath(configDir), 'utf8');
    const parsed = JSON.parse(raw) as { readonly version?: unknown; readonly updatedAt?: unknown };
    if (typeof parsed.version !== 'string' || parsed.version === '') {
      return null;
    }
    if (typeof parsed.updatedAt !== 'string' || parsed.updatedAt === '') {
      return null;
    }
    return { version: parsed.version, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
};

/**
 * Persist the version that just finished provisioning globally.
 *
 * @param configDir - Claude user config dir.
 * @param version - CLI version that was installed.
 * @param now - Clock injection for tests (defaults to `new Date()`).
 * @example
 * await writeInstallState(paths.configDir, '0.6.2');
 */
export const writeInstallState = async (
  configDir: string,
  version: string,
  now: () => Date = () => new Date(),
): Promise<InstallState> => {
  const state: InstallState = {
    version,
    updatedAt: now().toISOString(),
  };
  await mkdir(configDir, { recursive: true });
  await writeFile(installStatePath(configDir), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
};
