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
  /**
   * Absolute path of the Session #1 web app created on first install, when that
   * step finished. Absent on older stamps and when Session #1 was skipped/failed.
   */
  readonly firstAppPath?: string;
};

/** Optional fields when writing install state after a successful global install. */
export type WriteInstallStateOptions = {
  /** Absolute path of the first-run app (omit to leave previous value / unset). */
  readonly firstAppPath?: string;
  /** When true, clear a previously recorded first-app path. */
  readonly clearFirstAppPath?: boolean;
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
    const parsed = JSON.parse(raw) as {
      readonly version?: unknown;
      readonly updatedAt?: unknown;
      readonly firstAppPath?: unknown;
    };
    if (typeof parsed.version !== 'string' || parsed.version === '') {
      return null;
    }
    if (typeof parsed.updatedAt !== 'string' || parsed.updatedAt === '') {
      return null;
    }
    const firstAppPath =
      typeof parsed.firstAppPath === 'string' && parsed.firstAppPath !== ''
        ? parsed.firstAppPath
        : undefined;
    return {
      version: parsed.version,
      updatedAt: parsed.updatedAt,
      ...(firstAppPath === undefined ? {} : { firstAppPath }),
    };
  } catch {
    return null;
  }
};

/**
 * Persist the version that just finished provisioning globally.
 *
 * @param configDir - Claude user config dir.
 * @param version - CLI version that was installed.
 * @param options - Optional first-app path and clock.
 * @param now - Clock injection for tests (defaults to `new Date()`).
 */
export const writeInstallState = async (
  configDir: string,
  version: string,
  options: WriteInstallStateOptions = {},
  now: () => Date = () => new Date(),
): Promise<InstallState> => {
  const previous = await readInstallState(configDir);
  let firstAppPath = previous?.firstAppPath;
  if (options.clearFirstAppPath === true) {
    firstAppPath = undefined;
  } else if (options.firstAppPath !== undefined && options.firstAppPath !== '') {
    firstAppPath = options.firstAppPath;
  }

  const state: InstallState = {
    version,
    updatedAt: now().toISOString(),
    ...(firstAppPath === undefined ? {} : { firstAppPath }),
  };
  await mkdir(configDir, { recursive: true });
  await writeFile(installStatePath(configDir), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
};
