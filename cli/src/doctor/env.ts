import { loadEnvFile as loadCoreEnvFile, mergeEnvFile } from '@vybekiit/core/node';
import { writeEnvKeys as writeEnvKeysToFile } from './writeEnvKeys';

/**
 * Load a project's `.env` file.
 *
 * @param cwd - Project directory to read.
 * @returns Parsed env key/value pairs.
 * @example
 * const env = loadEnvFile(process.cwd());
 */
export const loadEnvFile = (cwd: string): Record<string, string> => loadCoreEnvFile(cwd);

/**
 * Merge process.env with a parsed `.env` file; file values win.
 *
 * @param processEnv - Current process environment.
 * @param fileEnv - Parsed `.env` values.
 * @returns Combined environment with file values taking precedence.
 * @example
 * const env = mergeEnv(process.env, loadEnvFile(process.cwd()));
 */
export const mergeEnv = (
  processEnv: Record<string, string | undefined>,
  fileEnv: Record<string, string>,
): Record<string, string | undefined> => mergeEnvFile(processEnv, fileEnv);

/**
 * Upsert env keys into the project's `.env` file.
 *
 * @param cwd - Project directory to update.
 * @param keys - Env values to write.
 * @returns Void after `.env` is updated.
 * @example
 * writeEnvKeys(process.cwd(), { STORAGE_PROVIDER: 'r2' });
 */
export const writeEnvKeys = (cwd: string, keys: Record<string, string>): void => {
  writeEnvKeysToFile(cwd, keys);
};
