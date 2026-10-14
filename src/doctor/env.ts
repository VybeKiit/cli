import {
  loadAppEnv,
  mergeEnvFile,
  SETTINGS_FILE,
  splitSettingsAndSecrets,
} from '@vybekiit/core/node';
import { writeEnvKeys as writeEnvKeysToFile } from './writeEnvKeys';

/**
 * Load a project's `settings.env` plus its `.env`; `.env` wins.
 *
 * @param cwd - Project directory to read.
 * @returns Parsed env key/value pairs.
 * @example
 * const env = loadEnvFile(process.cwd());
 */
export const loadEnvFile = (cwd: string): Record<string, string> => loadAppEnv(cwd);

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
 * Upsert env keys: keys listed in `settings.env` update it, every other key goes to `.env`.
 *
 * @param cwd - Project directory to update.
 * @param keys - Env values to write.
 * @returns Void after the files are updated.
 */
export const writeEnvKeys = (cwd: string, keys: Record<string, string>): void => {
  const { settings, secrets } = splitSettingsAndSecrets(cwd, keys);
  if (Object.keys(settings).length > 0) {
    writeEnvKeysToFile(cwd, settings, SETTINGS_FILE);
  }
  if (Object.keys(secrets).length > 0) {
    writeEnvKeysToFile(cwd, secrets);
  }
};
