import { loadEnvFile, mergeEnvFile } from '@vybekiit/core/node';

/** @deprecated Use {@link loadEnvFile} from `@vybekiit/core/node`. */
export { loadEnvFile };

/** Merge process.env with a parsed `.env` file (file wins on conflict). */
export function mergeEnv(
  processEnv: Record<string, string | undefined>,
  fileEnv: Record<string, string>,
): Record<string, string | undefined> {
  return mergeEnvFile(processEnv, fileEnv);
}

export { writeEnvKeys } from './writeEnvKeys';
